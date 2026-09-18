import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  gestureIntent,
  pullDistance,
  refreshThreshold,
  swipeDirection,
} from "./gestures";
import type { GestureIntent } from "./gestures";

type Options = {
  context: string;
  enabled: boolean;
  onSwipe?: (step: -1 | 1) => void;
  onRefresh: (signal: AbortSignal) => Promise<void>;
  onError: () => void;
};

export function useFeedGestures(
  container: RefObject<HTMLDivElement | null>,
  options: Options,
) {
  const latest = useRef(options);
  latest.current = options;
  const request = useRef<AbortController | null>(null);
  const suppressClickUntil = useRef(0);
  const lastTouch = useRef(0);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    if (!latest.current.enabled || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setRefreshing(true);
    setDistance(refreshThreshold);
    container.current?.scrollTo(0, 0);
    try {
      await latest.current.onRefresh(controller.signal);
    } catch {
      if (!controller.signal.aborted) latest.current.onError();
    } finally {
      if (request.current === controller) {
        request.current = null;
        setRefreshing(false);
        setDistance(0);
      }
    }
  }

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const element = container.current;
    setDistance(0);
    setRefreshing(false);
    if (!element || !options.enabled) return;

    let gesture: {
      x: number;
      y: number;
      dx: number;
      dy: number;
      atTop: boolean;
      intent: GestureIntent;
    } | null = null;
    let mouse = false;

    function eligible(target: EventTarget | null, x: number) {
      if (!(target instanceof Element)) return false;
      const bounds = element!.getBoundingClientRect();
      // Leave edge gestures to the browser and operating system.
      if (x < bounds.left + 20 || x > bounds.right - 20) return false;
      if (
        target.closest(
          'input, textarea, select, [contenteditable="true"], video, audio, canvas, [role="slider"], .chips, .tabs, .periods, .market-overview, [data-gesture-ignore]',
        )
      )
        return false;
      const control = target.closest("button, a, summary");
      if (control && !control.hasAttribute("data-gesture-surface"))
        return false;
      for (
        let node: Element | null = target;
        node && node !== element;
        node = node.parentElement
      ) {
        if (
          node.scrollWidth > node.clientWidth + 1 &&
          /auto|scroll/.test(getComputedStyle(node).overflowX)
        )
          return false;
      }
      return true;
    }

    function start(target: EventTarget | null, x: number, y: number) {
      if (request.current || !eligible(target, x)) return false;
      gesture = {
        x,
        y,
        dx: 0,
        dy: 0,
        atTop: element!.scrollTop <= 1,
        intent: "pending",
      };
      return true;
    }

    function move(event: Event, x: number, y: number) {
      if (!gesture) return;
      gesture.dx = x - gesture.x;
      gesture.dy = y - gesture.y;
      if (gesture.intent === "pending")
        gesture.intent = gestureIntent(gesture.dx, gesture.dy, {
          swipe: !!latest.current.onSwipe,
          refresh: true,
          atTop: gesture.atTop,
        });
      if (gesture.intent !== "pending")
        suppressClickUntil.current = Date.now() + 500;
      // Reserve a downward pull before native overscroll takes over.
      if (
        gesture.intent === "pending" &&
        gesture.atTop &&
        gesture.dy > Math.abs(gesture.dx) &&
        event.cancelable
      )
        event.preventDefault();
      if (gesture.intent === "swipe" || gesture.intent === "pull") {
        if (!event.cancelable) {
          cancel();
          return;
        }
        event.preventDefault();
        suppressClickUntil.current = Date.now() + 500;
        if (gesture.intent === "pull") setDistance(pullDistance(gesture.dy));
      }
    }

    function cancel() {
      gesture = null;
      mouse = false;
      if (!request.current) setDistance(0);
    }

    function end() {
      const completed = gesture;
      cancel();
      if (!completed) return;
      if (completed.intent !== "pending")
        suppressClickUntil.current = Date.now() + 500;
      if (completed.intent === "swipe") {
        const direction = swipeDirection(completed.dx, completed.dy);
        if (direction) latest.current.onSwipe?.(direction);
      } else if (
        completed.intent === "pull" &&
        pullDistance(completed.dy) >= refreshThreshold
      )
        void refreshRef.current();
    }

    function touchStart(event: TouchEvent) {
      lastTouch.current = Date.now();
      suppressClickUntil.current = 0;
      if (event.touches.length !== 1) return cancel();
      const touch = event.touches[0];
      start(event.target, touch.clientX, touch.clientY);
    }
    function touchMove(event: TouchEvent) {
      lastTouch.current = Date.now();
      if (event.touches.length !== 1) return cancel();
      const touch = event.touches[0];
      move(event, touch.clientX, touch.clientY);
    }
    function touchEnd() {
      lastTouch.current = Date.now();
      end();
    }
    function mouseDown(event: MouseEvent) {
      if (event.button !== 0 || Date.now() - lastTouch.current < 800) return;
      suppressClickUntil.current = 0;
      mouse = start(event.target, event.clientX, event.clientY);
      if (mouse) event.preventDefault();
    }
    function mouseMove(event: MouseEvent) {
      if (!mouse) return;
      if (event.buttons !== 1) return cancel();
      move(event, event.clientX, event.clientY);
    }
    function mouseUp() {
      if (mouse) end();
    }
    function click(event: MouseEvent) {
      if (event.detail !== 0 && Date.now() < suppressClickUntil.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    element.addEventListener("touchstart", touchStart, { passive: true });
    element.addEventListener("touchmove", touchMove, { passive: false });
    element.addEventListener("touchend", touchEnd);
    element.addEventListener("touchcancel", cancel);
    element.addEventListener("mousedown", mouseDown);
    element.addEventListener("click", click, true);
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", mouseUp);
    window.addEventListener("blur", cancel);
    return () => {
      element.removeEventListener("touchstart", touchStart);
      element.removeEventListener("touchmove", touchMove);
      element.removeEventListener("touchend", touchEnd);
      element.removeEventListener("touchcancel", cancel);
      element.removeEventListener("mousedown", mouseDown);
      element.removeEventListener("click", click, true);
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", mouseUp);
      window.removeEventListener("blur", cancel);
      request.current?.abort();
      request.current = null;
    };
  }, [container, options.context, options.enabled]);

  return { distance, refreshing };
}
