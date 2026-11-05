const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/views/HousingAssistant.vue'),'utf8');
test('assistant page offers FAQ and small-talk prompts beside the conversation',()=>{
  for(const prompt of ['How do I report a lost item?','I found an item, where should I report it?','How do I claim a listed item?','Where is the community notice board?','How do I check maintenance request progress?','Hello','How are you?','Have a good day'])assert.ok(source.includes(prompt),prompt);
  assert.match(source,/<aside class="assistant-prompts"/);
  assert.match(source,/@click="askSuggestion\(prompt\)"/);
});
