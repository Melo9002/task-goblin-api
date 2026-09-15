import {test, beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {demoStore} from '../src/services/demoStore.js';
let data;
beforeEach(()=>{
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});
 data=new Map();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)}});
});
test('demo persists the lifecycle and rejects stale edits',async()=>{
 const task=await demoStore.createTask({title:'Test',status:'TODO',priority:'HIGH',dueDate:'2026-09-18'});
 const updated=await demoStore.updateTask(task.id,{...task,status:'DONE'});
 assert.equal(updated.version,1);
 assert.equal((await demoStore.getSummary()).done,1);
 await assert.rejects(demoStore.updateTask(task.id,{...task,title:'Stale'}),{status:409});
 await assert.rejects(demoStore.deleteTask(task.id,0),{status:409});
 await demoStore.deleteTask(task.id,1);
 assert.equal((await demoStore.getTasks()).totalItems,0);
 const next=await demoStore.createTask({title:'New task'});
 assert.notEqual(next.id,task.id);
});
test('demo does not silently report success when browser storage fails',async()=>{
 globalThis.localStorage.setItem=()=>{throw new Error('QuotaExceeded');};
 await assert.rejects(demoStore.createTask({title:'Not saved'}),/not saved/);
 assert.equal((await demoStore.getTasks()).totalItems,0);
});
