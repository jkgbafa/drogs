import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const context={window:{}};
for(const file of ['question-history','bishop-questions','pastor-questions'])vm.runInNewContext(readFileSync(new URL(`../data/${file}.js`,import.meta.url),'utf8'),context);
const q=context.window;
test('new question sets contain ten questions, unique response fields, and continuation last',()=>{
 for(const questions of [q.BISHOP_QUESTIONS,q.PASTOR_QUESTIONS]){
  assert.equal(questions.length,10);assert.equal(questions.at(-1).id,'intention');
  const ids=questions.flatMap(question=>[question.id,...(question.followUps||[]).map(f=>f.id)]);
  assert.equal(new Set(ids).size,ids.length);
 }
 assert.equal(q.PASTOR_QUESTIONS.at(-1).options[1].value,'I wish to resign');
});
test('legacy question wording and separate version identifiers remain available',()=>{
 assert.equal(q.BISHOP_QUESTION_SET,'governance-2027-v3');assert.equal(q.PASTOR_QUESTION_SET,'pastor-2027-v2');
 assert(q.BISHOP_QUESTIONS_V1.some(x=>x.id==='standing'));
 assert(!q.BISHOP_QUESTIONS.some(x=>x.id==='standing'));
 assert(q.PASTOR_QUESTIONS_V1.some(x=>x.id==='pastorCalling'));
 assert(!q.PASTOR_QUESTIONS.some(x=>x.id==='pastorCalling'));
});

test('bishop questions 4, 6 and 8 stay intact and operational questions cover all seven requested topics',()=>{
 for(const index of [3,5,7])assert.deepEqual(q.BISHOP_QUESTIONS[index],q.BISHOP_QUESTIONS_V2[index]);
 for(const id of ['bishopPastorCount','bishopChurchCount','bishopPastorsContacted','bishopLeadershipMeetings','bishopJurisdictionChallenges','bishopIntervention','bishopGrowthTarget'])assert(q.BISHOP_QUESTIONS.some(x=>x.id===id));
 assert(q.BISHOP_QUESTIONS_V2.some(x=>x.id==='doctrine'));
});

test('pastor question 4 accepts None without ministry detail fields',()=>{
 const question=q.PASTOR_QUESTIONS[3];assert.equal(question.id,'pastorActiveMinistry');assert(question.options.includes('None'));assert(question.followUps.every(field=>field.when==='Yes'));
});
