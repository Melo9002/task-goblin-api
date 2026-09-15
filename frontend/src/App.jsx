import React, { useCallback, useEffect, useRef, useState } from 'react';
import TaskCard from './components/TaskCard.jsx';
import TaskForm from './components/TaskForm.jsx';
import GoblinStatus from './components/GoblinStatus.jsx';
import { taskApi, DEMO_MODE } from './services/taskApi.js';
import { asset, localToday, stages } from './domain/taskRules.js';

const emptySummary = {total:0,open:0,inProgress:0,done:0,overdue:0};
const initialFilters = {q:'',status:'',priority:'',sort:'createdAt,desc',page:0,size:12};
function Dialog({title,children,onClose}) {
  const ref = useRef(null);
  useEffect(()=>{ref.current.showModal();},[]);
  return <dialog ref={ref} onCancel={e=>{e.preventDefault();onClose();}} aria-labelledby="dialog-title"><div className="dialog-header"><span className="eyebrow">THE WOODLAND GUILD</span><button className="icon-button" aria-label="Close dialog" onClick={onClose}>×</button></div><h2 id="dialog-title">{title}</h2>{children}</dialog>;
}
export default function App() {
  const [filters,setFilters] = useState(initialFilters), [query,setQuery] = useState('');
  const [page,setPage] = useState({items:[],totalItems:0,totalPages:0});
  const [summary,setSummary] = useState(emptySummary), [loaded,setLoaded] = useState(false);
  const [loading,setLoading] = useState(true), [error,setError] = useState(''), [busy,setBusy] = useState(false);
  const [editor,setEditor] = useState(null), [deleting,setDeleting] = useState(null), [info,setInfo] = useState(null);
  const [deleteError,setDeleteError] = useState(''), [toast,setToast] = useState('');
  const [theme,setTheme] = useState(()=>{try{return localStorage.getItem('task-goblin-theme') || 'light';}catch{return 'light';}});
  const sequence = useRef(0), busyRef = useRef(false), drag = useRef(null), search = useRef(null);
  useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('task-goblin-theme',theme);}catch{}},[theme]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),5000);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{const timer=setTimeout(()=>setFilters(f=>({...f,q:query,page:0})),220);return()=>clearTimeout(timer);},[query]);
  const reload = useCallback(async()=>{
    const request = ++sequence.current; setLoading(true);
    try {
      const [result,counts] = await Promise.all([taskApi.getTasks(filters),taskApi.getSummary()]);
      if(request!==sequence.current)return;
      setPage(result);setSummary(counts);setLoaded(true);setError('');
      if(filters.page>0 && filters.page>=result.totalPages)setFilters(f=>({...f,page:Math.max(0,result.totalPages-1)}));
    }catch(error){if(request===sequence.current)setError(error.message);}
    finally{if(request===sequence.current)setLoading(false);}
  },[filters]);
  useEffect(()=>{reload();},[reload]);
  useEffect(()=>{
    const onKey = event=>{
      if(event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,select,dialog,[contenteditable]')||document.querySelector('dialog[open]'))return;
      if(event.key.toLowerCase()==='n'&&!busyRef.current){event.preventDefault();setEditor({initialStatus:'TODO'});}
      if(event.key==='/'){event.preventDefault();search.current?.focus();}
    };
    document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey);
  },[]);
  const changeFilter = (key,value)=>setFilters(f=>({...f,[key]:value,page:0}));
  async function mutate(action,success) {
    if(busyRef.current)return;
    busyRef.current=true;setBusy(true);
    try {const result=await action();success?.(result);await reload();return result;}
    finally{busyRef.current=false;setBusy(false);}
  }
  async function save(dto,id) {
    try {await mutate(()=>id?taskApi.updateTask(id,dto):taskApi.createTask(dto),()=>{setEditor(null);setToast('Orders received. Your task is saved.');});}
    catch(error){if(error.status===409||error.status===404)await reload();throw error;}
  }
  async function move(task,status) {
    if(task.status===status)return;
    try{await mutate(()=>taskApi.updateTask(task.id,{...task,status}),()=>setToast(status==='DONE'?'Bonked! +10 imaginary shinies. Small win, big goblin energy.':'Plan updated. One small step at a time.'));}
    catch(error){setError(error.message);if(error.status===409||error.status===404){await reload();setToast(error.message);}}
  }
  async function remove() {
    setDeleteError('');
    try{await mutate(()=>taskApi.deleteTask(deleting.id,deleting.version),()=>{setDeleting(null);setToast('Task released into the wild. Room for what matters.');});}
    catch(error){setDeleteError(error.message);}
  }
  async function samples() {
    if(summary.total||busyRef.current)return;
    const tomorrow = new Date();tomorrow.setDate(tomorrow.getDate()+1);
    let count=0;
    try{await mutate(async()=>{
      for(const [title,description,priority,status,dueDate] of [
        ['Send that email. You know the one.','Three sentences. One deep breath. Hit send.','HIGH','TODO',localToday(tomorrow)],
        ['Make something just for the fun of it','No productivity goals. The goblins insist.','LOW','TODO',null],
        ['Polish the portfolio','Give that almost-finished project its moment in the sun.','HIGH','IN_PROGRESS',localToday(tomorrow)],
        ['Take the big idea one tiny step further','A messy first draft also counts.','MEDIUM','IN_PROGRESS',null],
        ['Water the desk plant','The unofficial fourth member of the guild.','LOW','DONE',localToday()],
        ['Finally start the thing','The hardest bit is behind you. Have a shiny.','MEDIUM','DONE',null],
      ]){await taskApi.createTask({title,description,priority,status,dueDate});count++;}
    },()=>setToast('Six sample tasks. Make them your own, boss.'));}
    catch(error){await reload();setError(`${count} sample tasks saved. ${error.message}`);}
  }
  const blocked=busy||loading;
  const visibleStages=stages.filter(s=>!filters.status||filters.status==='OPEN'&&s.id!=='DONE'||filters.status===s.id);
  return <>
    <a className="skip-link" href="#main">Skip to task board</a>
    <aside className="sidebar"><a className="brand" href={import.meta.env.BASE_URL}><img src={asset('goblin')} width="45" height="45" alt=""/><span>task goblin<span className="brand-sub">A SMALL BUT MIGHTY GUILD</span></span></a>
      <div className="workspace"><span className="workspace-mark">W</span><span>The woodland guild<small>{DEMO_MODE?'Your browser demo':'Your personal workspace'}</small></span><span className="tiny-star">✦</span></div>
      <p className="nav-label">THE WORKSHOP</p><nav aria-label="Main navigation"><a href="#main" className="nav-item active"><span aria-hidden="true">▦</span>Goblin Hoard (Tasks)<span className="nav-count">{summary.total}</span></a><button className="nav-item" onClick={()=>setInfo('crew')} aria-label="Meet the crew"><span aria-hidden="true">♧</span>Meet the crew<span className="nav-note">3</span></button><button className="nav-item" onClick={()=>setInfo('guide')} aria-label="Guild handbook"><span aria-hidden="true">▤</span>Guild handbook<span className="nav-note">↗</span></button></nav>
      <div className="sidebar-bottom"><div className="goblin-note"><img src={asset('grub')} alt="Grub holding a small sprout"/><p>“Big plans? Small steps.<br/>We got this, boss.”</p><span>GRUB · HEAD OF ENCOURAGEMENT</span></div><div className="local-status"><span className={`status-dot ${error?'offline':loaded?'online':''}`}/><span>{error?'Connection needs attention':DEMO_MODE?'Demo · saved in this browser':loaded?'API connected · saved on disk':'Waking the goblins…'}</span></div><p className="sidebar-foot">Made for humans. Run by goblins.</p></div>
    </aside>
    <div className="page"><header className="topbar"><div className="breadcrumb">The woodland guild<span>/</span><strong>Task board</strong></div><div className="topbar-right"><button className="theme-toggle" aria-pressed={theme==='dark'} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>☾ Cave Mode <span>(Dark Mode)</span></button><span className="avatar" aria-label="You, the boss">B</span></div></header>
    <main id="main" tabIndex="-1">
      {DEMO_MODE&&<div className="demo-banner"><strong>Interactive demo</strong><span>Tasks stay in this browser. The full app uses React + Spring Boot.</span><a href="https://github.com/Melo9002/task-goblin-api" target="_blank" rel="noreferrer">View source ↗</a></div>}
      <div className="page-heading"><div><p className="eyebrow"><span/>LITTLE BY LITTLE, LEGENDS ARE MADE</p><h1>Big plans. Tiny goblins.</h1><p className="subtitle">A little less overwhelm. A little more <em>“done, boss.”</em></p></div><button className="button primary" onClick={()=>setEditor({initialStatus:'TODO'})} disabled={blocked}>＋ Feed Goblin <span className="plain-label">(Add Task)</span><kbd>N</kbd></button></div>
      <GoblinStatus summary={summary}/>
      <section className="stats" aria-label="Overall progress"><div className="stat"><span className="stat-icon green" aria-hidden="true">⚑</span><div><span className="stat-label">Tasks in the hoard</span><strong>{summary.total}</strong></div><span className="stat-aside">{summary.open} still open</span></div><div className="stat"><span className="stat-icon orange" aria-hidden="true">⌁</span><div><span className="stat-label">Goblins on the job</span><strong>{summary.inProgress}</strong></div><span className="stat-aside">In progress</span></div><div className="stat"><span className="stat-icon gold" aria-hidden="true">✧</span><div><span className="stat-label">Shinies in the hoard</span><strong>{summary.done*10} <small>gold</small></strong></div><span className="stat-aside">10 per completed task</span></div></section>
      <section className="board-section" aria-labelledby="board-heading"><div className="board-heading"><div className="board-title"><h2 id="board-heading">Goblin Hoard <span>(Tasks)</span></h2><span className="board-count">{page.totalItems} tasks</span></div>{loaded&&summary.total===0&&<button className="text-button" onClick={samples} disabled={blocked}>✧ Try sample tasks</button>}</div>
      <div className="toolbar"><label className="search"><span aria-hidden="true">⌕</span><input ref={search} type="search" aria-label="Search tasks" placeholder="Find a task…" maxLength={255} value={query} onChange={e=>setQuery(e.target.value)}/><kbd>/</kbd></label><label className="filter"><span className="sr-only">Filter by status</span><select value={filters.status} onChange={e=>changeFilter('status',e.target.value)}><option value="">All statuses</option><option value="OPEN">Open tasks</option>{stages.map(s=><option value={s.id} key={s.id}>{s.plain}</option>)}</select></label><label className="filter"><span className="sr-only">Filter by priority</span><select value={filters.priority} onChange={e=>changeFilter('priority',e.target.value)}><option value="">All priorities</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></label><label className="filter sort"><span className="sr-only">Sort tasks</span><select value={filters.sort} onChange={e=>changeFilter('sort',e.target.value)}><option value="createdAt,desc">Newest first</option><option value="createdAt,asc">Oldest first</option><option value="priority,asc">High priority first</option><option value="dueDate,asc">Due date first</option></select></label><button className="icon-button" onClick={reload} disabled={blocked} aria-label="Refresh board">↻</button></div>
      {error&&<div className="error-banner" role="alert">{error} <button className="text-button" onClick={reload} disabled={blocked}>Retry</button></div>}
      <div className={`board ${visibleStages.length<3?'filtered-board':''}`} aria-busy={loading}>
      {visibleStages.map(stage=>{const items=page.items.filter(t=>t.status===stage.id);return <section className="column" data-status={stage.id} key={stage.id} aria-labelledby={`stage-${stage.id}`} onDragOver={e=>{if(drag.current&&!blocked)e.preventDefault();}} onDrop={e=>{e.preventDefault();if(drag.current&&!blocked)move(drag.current,stage.id);drag.current=null;}}><div className="column-header"><span className="column-dot"/><h3 id={`stage-${stage.id}`}>{stage.label} <span>({stage.plain})</span></h3><span className="column-count">{items.length}</span></div><p className="column-caption">{stage.caption}</p>
        {!loaded&&loading?<div className="loading-placeholder" aria-label="Loading tasks"/>:items.length?items.map(task=><TaskCard key={task.id} task={task} busy={blocked} onEdit={task=>setEditor({task})} onDelete={task=>{setDeleting(task);setDeleteError('');}} onMove={move} onDrag={task=>{drag.current=task;}}/>):<div className="column-empty"><img src={asset(stage.goblin)} alt=""/><p>{!loaded?'Waiting for the guild…':page.totalItems?'Nothing on this page.':'A little room for possibility.'}</p><small>{!loaded?'Use Retry to reconnect.':page.totalItems?'Try another page or filter.':'Add a task. Small ones count.'}</small></div>}
        <button className="column-add" disabled={blocked} onClick={()=>setEditor({initialStatus:stage.id})}>＋ Feed Goblin (Add Task)</button></section>;})}</div>
      <div className="pagination"><span aria-live="polite">{loading?'Loading the hoard…':`Showing ${page.items.length?filters.page*filters.size+1:0}–${filters.page*filters.size+page.items.length} of ${page.totalItems} matching tasks`}</span><div><button disabled={blocked||filters.page===0} onClick={()=>setFilters(f=>({...f,page:f.page-1}))}>← Previous</button><span>Page {page.totalPages?filters.page+1:1} of {Math.max(1,page.totalPages)}</span><button disabled={blocked||filters.page+1>=page.totalPages} onClick={()=>setFilters(f=>({...f,page:f.page+1}))}>Next →</button></div></div>
      </section><footer className="page-footer"><span><span className="footer-leaf">❧</span>Productivity, with a little mischief.</span><button className="text-button" onClick={()=>setInfo('guide')}>Take a peek under the hood ↗</button></footer>
    </main></div>
    {editor&&<TaskForm {...editor} onClose={()=>setEditor(null)} onSave={save}/>}
    {deleting&&<Dialog title="Throw in Pit (Delete Task)?" onClose={()=>{if(!busy)setDeleting(null);}}><p className="dialog-intro">“{deleting.title}” will be permanently removed. {deleting.completed?'Its 10 imaginary shinies go with it. ':''}No judgement from the goblins.</p>{deleteError&&<p className="form-error" role="alert">{deleteError}</p>}<div className="dialog-actions"><button className="button secondary" disabled={busy} onClick={()=>setDeleting(null)}>Keep it (Cancel)</button><button className="button danger" disabled={busy} onClick={remove}>{busy?'Deleting…':'Throw in Pit (Delete)'}</button></div></Dialog>}
    {info&&<Dialog title={info==='crew'?'Small crew. Big quest energy.':'A field guide to the guild.'} onClose={()=>setInfo(null)}>{info==='crew'?<>{[['grub','Grub · the gatherer','Keeps your ideas safe. Believes every adventure starts with a small list.'],['nib','Nib · the doer','Owns seventeen pencils. Has a plan for at least three of them.'],['bonk','Bonk · the celebrator','Takes your small wins very seriously. Awards one extremely imaginary handful of gold.']].map(([name,title,copy])=><div className="crew-member" key={name}><img src={asset(name)} alt=""/><div><h3>{title}</h3><p>{copy}</p></div></div>)}</>:<div className="handbook"><h3>1. Feed the goblin</h3><p>Add a title, optional details, priority and due date. Press N to add or / to search. Goofy labels always come with their real meaning.</p><h3>2. Give your task a nudge</h3><p>Use the status menu or drag a card between columns on desktop. Bonk Done completes it; Second Thoughts reopens it. Native controls work with a keyboard.</p><h3>3. Hoard the little victories</h3><p>Each currently completed task adds 10 imaginary gold. Reopening or deleting it removes ten. No real money, no permanent wallet, no farming shinies.</p><h3>Where the tasks live</h3><p>{DEMO_MODE?'This Pages demo saves only in this browser. Clearing site data removes its tasks. It does not contact a Java API.':'This local app saves through Spring Boot to a file database. Tasks survive server restarts. This is a personal workspace, with no accounts or cloud sync.'}</p><h3>Under the hood</h3><p>React + Vite → Spring Boot → service → JPA repository → H2 or PostgreSQL. Validated DTOs, database migrations, stale-edit protection, paginated queries and automated tests.</p>{!DEMO_MODE&&<p><a href="http://127.0.0.1:8080/swagger-ui/index.html" target="_blank" rel="noreferrer">Explore the live Swagger API docs ↗</a></p>}<p><a href="https://github.com/Melo9002/task-goblin-api" target="_blank" rel="noreferrer">View the project on GitHub ↗</a></p></div>}</Dialog>}
    {toast&&<div className="toast" role="status">{toast}</div>}
  </>;
}
