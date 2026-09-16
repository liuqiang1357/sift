import test from 'node:test';
import assert from 'node:assert/strict';
import { demoSaved, demoRead, demoConversations, addMissingRecords } from '../src/demo-records.ts';
import { stories } from '../src/data.ts';

test('starter records open existing content and include Chinese conversations', () => {
  const ids = new Set(stories.map(story => story.id));
  assert.ok(demoSaved.length > 0);
  for(const id of [...demoSaved, ...demoRead]) assert.ok(ids.has(id) || id === 'brief-09.16');
  for(const conversation of demoConversations) {
    assert.ok(conversation.messages.some(message => message.role === 'user'));
    assert.ok(conversation.messages.some(message => message.role === 'assistant'));
    assert.ok(conversation.messages.every(message => /[\u3400-\u9fff]/u.test(message.text)));
  }
});

test('adding samples preserves existing conversations, including edits to a sample', () => {
  const edited = {...demoConversations[0], messages: [{role:'user',text:'我的记录不可覆盖'}]};
  const existing = [edited, {id:'custom',context:'我的问题',messages:[]}];
  const result = addMissingRecords(existing, demoConversations, item => item.id);
  assert.equal(result[0], edited);
  assert.equal(result[1], existing[1]);
  assert.equal(result.length, 3);
  assert.deepEqual(addMissingRecords(result,demoConversations,item=>item.id), result);
  assert.equal(existing.length, 2);
});
