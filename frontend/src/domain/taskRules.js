export const stages = [
  { id: 'TODO', label: 'Up for grabs', plain: 'To do', goblin: 'grub', caption: 'Grub is collecting the possibilities.' },
  { id: 'IN_PROGRESS', label: 'On it, boss', plain: 'In progress', goblin: 'nib', caption: 'Nib has a plan. Probably.' },
  { id: 'DONE', label: 'Properly bonked', plain: 'Done', goblin: 'bonk', caption: 'Bonk is very proud of you.' },
];
export const asset = name => `${import.meta.env?.BASE_URL || '/'}assets/${name}.svg`;
export function localToday(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function isOverdue(task, today = localToday()) {
  return task.status !== 'DONE' && Boolean(task.dueDate) && task.dueDate < today;
}
export function goblinMood(summary) {
  if (summary.overdue) return { name: 'nib', text: 'Goblin is judging your life choices.', note: `${summary.overdue} overdue task${summary.overdue === 1 ? '' : 's'}. One small step will help.` };
  if (!summary.open) return { name: 'grub', text: 'Suspiciously peaceful…', note: 'No open tasks. The goblin is considering a nap.' };
  if (summary.open >= 5) return { name: 'bonk', text: 'Goblin has begun hoarding.', note: 'One task at a time, boss. The pile can wait.' };
  return { name: 'grub', text: 'Goblin is adequately employed.', note: 'A manageable little hoard. We like your style.' };
}
export function selectPage(tasks, { q='', status='', priority='', sort='createdAt,desc', page=0, size=12, dueBefore='' } = {}) {
  const needle = q.trim().toLocaleLowerCase();
  const ranks = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const [field, direction='asc'] = sort.split(',');
  const filtered = tasks.filter(t => (!priority || t.priority === priority) &&
    (!status || (status === 'OPEN' ? t.status !== 'DONE' : t.status === status)) &&
    (!dueBefore || (t.dueDate && t.dueDate <= dueBefore)) &&
    (!needle || `${t.title} ${t.description || ''}`.toLocaleLowerCase().includes(needle)))
    .sort((a,b) => {
      if (field === 'dueDate' && (!a.dueDate || !b.dueDate)) return a.dueDate ? -1 : b.dueDate ? 1 : b.id-a.id;
      const av = field === 'priority' ? ranks[a.priority] : a[field];
      const bv = field === 'priority' ? ranks[b.priority] : b[field];
      const delta = av < bv ? -1 : av > bv ? 1 : 0;
      return (direction === 'desc' ? -delta : delta) || b.id-a.id;
    });
  return { items: filtered.slice(page*size, (page+1)*size), page, size, totalItems: filtered.length, totalPages: Math.ceil(filtered.length/size) };
}
export function summarize(tasks, today = localToday()) {
  const done = tasks.filter(t => t.status === 'DONE').length;
  return { total: tasks.length, open: tasks.length-done, done, inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length, overdue: tasks.filter(t=>isOverdue(t,today)).length };
}
