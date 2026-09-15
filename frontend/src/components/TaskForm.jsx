import React, { useEffect, useRef, useState } from 'react';
import { stages } from '../domain/taskRules.js';
export default function TaskForm({ task, initialStatus='TODO', onClose, onSave }) {
  const dialog = useRef(null);
  const [draft,setDraft] = useState({title:task?.title || '',description:task?.description || '',priority:task?.priority || 'MEDIUM',status:task?.status || initialStatus,dueDate:task?.dueDate || ''});
  const [busy,setBusy] = useState(false), [error,setError] = useState('');
  useEffect(()=>{ dialog.current.showModal(); },[]);
  const update = event=>setDraft({...draft,[event.target.name]:event.target.value});
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    if (!draft.title.trim()) { setError('Give this task a title. Even goblins need a clue.'); return; }
    setBusy(true); setError('');
    try { await onSave({...draft,title:draft.title.trim(),description:draft.description.trim(),dueDate:draft.dueDate || null,...(task ? {version:task.version} : {})},task?.id); }
    catch(error) { setError(error.message + (error.status===409?' Your draft is still here. Close and reopen the task to use the latest version.':'')); setBusy(false); }
  }
  return <dialog ref={dialog} aria-labelledby="form-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}><form onSubmit={submit}><div className="dialog-header"><span className="eyebrow">A WORD WITH THE GUILD</span><button type="button" className="icon-button" aria-label="Close form" disabled={busy} onClick={onClose}>×</button></div><h2 id="form-title">{task?'Fix Scribble (Edit Task)':'Feed Goblin (Add Task)'}</h2><p className="dialog-intro">Small tasks count. Even the “send that one email” kind.</p>
    <label className="field">Task title<input name="title" autoFocus required maxLength={255} value={draft.title} onChange={update} placeholder="What are we conquering?"/></label>
    <label className="field">The details <span className="optional">(optional)</span><textarea name="description" maxLength={2000} rows={3} value={draft.description} onChange={update} placeholder="A map, a clue, a wildly specific instruction…"/></label>
    <div className="field-row"><label className="field">Important Shiny (Priority)<select name="priority" value={draft.priority} onChange={update}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label><label className="field">Deadline Doom (Due Date)<input type="date" name="dueDate" value={draft.dueDate} onChange={update}/></label></div>
    <label className="field">Quest progress (Status)<select name="status" value={draft.status} onChange={update}>{stages.map(s=><option key={s.id} value={s.id}>{s.label} ({s.plain})</option>)}</select></label>
    {error && <p className="form-error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="button secondary" onClick={onClose} disabled={busy}>Never mind (Cancel)</button><button className="button primary" disabled={busy}>{busy?'Saving…':task?'Save changes':'Feed Goblin (Add)'}</button></div></form></dialog>;
}
