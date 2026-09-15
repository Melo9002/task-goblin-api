import React from 'react';
import { asset, isOverdue, stages } from '../domain/taskRules.js';
export default function TaskCard({ task, busy, onEdit, onDelete, onMove, onDrag }) {
  const stage = stages.find(s=>s.id===task.status);
  const overdue = isOverdue(task);
  const due = task.dueDate ? new Intl.DateTimeFormat('en', {month:'short',day:'numeric'}).format(new Date(`${task.dueDate}T12:00:00`)) : 'No due date';
  return <article className={`task-card ${task.completed ? 'done' : ''}`} draggable={!busy} onDragStart={event=>{ onDrag(task); event.dataTransfer.setData('text/plain',String(task.id)); event.dataTransfer.effectAllowed='move'; }} onDragEnd={()=>onDrag(null)}>
    <div className="task-top"><span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority.toLowerCase()} priority</span><span className={`due-date ${overdue?'overdue':''}`} title={task.dueDate || undefined}>{overdue?'! Overdue · ':''}{due}</span></div>
    <button className="task-title" onClick={()=>onEdit(task)} disabled={busy}>{task.title}</button>
    {task.description && <p className="task-description">{task.description}</p>}
    <div className="task-actions"><button onClick={()=>onEdit(task)} disabled={busy}>Fix Scribble <span>(Edit)</span></button><button onClick={()=>onDelete(task)} disabled={busy}>Throw in Pit <span>(Delete)</span></button></div>
    <div className="task-bottom"><img src={asset(stage.goblin)} alt=""/><span className="task-id">QUEST {String(task.id).padStart(3,'0')}</span><select className="task-status" aria-label={`Status of ${task.title}`} value={task.status} onChange={event=>onMove(task,event.target.value)} disabled={busy}>{stages.map(s=><option key={s.id} value={s.id}>{s.label} ({s.plain})</option>)}</select></div>
    <button className={`complete-button ${task.completed?'reopen':''}`} disabled={busy} onClick={()=>onMove(task,task.completed?'TODO':'DONE')}>{task.completed?'Second Thoughts (Reopen)':'✓ Bonk Done (Complete)'}</button>
  </article>;
}
