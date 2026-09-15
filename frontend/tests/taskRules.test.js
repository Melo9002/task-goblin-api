import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectPage,summarize,isOverdue,goblinMood,localToday} from '../src/domain/taskRules.js';
const tasks=[
 {id:1,title:'Feed the fern',description:'Desk plant',priority:'LOW',status:'DONE',dueDate:'2026-09-12',createdAt:'2026-09-10T00:00:00Z'},
 {id:2,title:'Polish portfolio',description:null,priority:'HIGH',status:'TODO',dueDate:'2026-09-13',createdAt:'2026-09-11T00:00:00Z'},
 {id:3,title:'Write a note',description:'To the fern',priority:'MEDIUM',status:'IN_PROGRESS',dueDate:null,createdAt:'2026-09-11T00:00:00Z'},
];
test('search, priority and status filters combine without mutating input',()=>{
 assert.deepEqual(selectPage(tasks,{q:' FERN '}).items.map(t=>t.id),[3,1]);
 assert.deepEqual(selectPage(tasks,{q:'fern',status:'OPEN'}).items.map(t=>t.id),[3]);
 assert.equal(selectPage(tasks,{priority:'HIGH',status:'DONE'}).totalItems,0);
 assert.deepEqual(tasks.map(t=>t.id),[1,2,3]);
});
test('pagination and stable sorting match API contract',()=>{
 assert.deepEqual(selectPage(tasks,{page:1,size:1}).items.map(t=>t.id),[2]);
 assert.equal(selectPage(tasks,{size:1}).totalPages,3);
 assert.deepEqual(selectPage(tasks,{sort:'priority,asc'}).items.map(t=>t.id),[2,3,1]);
 assert.deepEqual(selectPage(tasks,{sort:'dueDate,asc'}).items.map(t=>t.id),[1,2,3]);
 assert.deepEqual(selectPage(tasks,{sort:'dueDate,desc'}).items.map(t=>t.id),[2,1,3]);
});
test('due dates are local calendar dates; completed or undated tasks are never overdue',()=>{
 assert.equal(localToday(new Date(2026,8,14,23,59)),'2026-09-14');
 assert.equal(isOverdue(tasks[0],'2026-09-14'),false);
 assert.equal(isOverdue(tasks[1],'2026-09-14'),true);
 assert.equal(isOverdue(tasks[1],'2026-09-13'),false);
 assert.equal(isOverdue(tasks[2],'2026-09-14'),false);
});
test('mascot prioritizes overdue work over workload thresholds',()=>{
 assert.match(goblinMood({open:0,overdue:0}).text,/peaceful/);
 assert.match(goblinMood({open:4,overdue:0}).text,/employed/);
 assert.match(goblinMood({open:5,overdue:0}).text,/hoarding/);
 assert.match(goblinMood({open:5,overdue:1}).text,/judging/);
});
test('counts and shinies reflect current records, not lifetime completions',()=>{
 assert.deepEqual(summarize(tasks,'2026-09-14'),{total:3,open:2,inProgress:1,done:1,overdue:1});
 assert.equal(summarize(tasks.map(t=>({...t,status:'TODO'}))).done*10,0);
 assert.equal(summarize(tasks.slice(1)).done*10,0);
});
