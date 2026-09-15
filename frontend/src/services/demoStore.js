import { localToday, selectPage, summarize } from '../domain/taskRules.js';
const KEY = 'task-goblin-demo-v1';
function read() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { tasks: [], nextId: 1 };
  try { const data = JSON.parse(raw); if (!Array.isArray(data.tasks) || !Number.isSafeInteger(data.nextId)) throw Error(); return data; }
  catch { throw new Error('The saved demo data could not be read. Export or clear this site’s browser data to start a fresh demo.'); }
}
function save(tasks) {
  try { localStorage.setItem(KEY, JSON.stringify(tasks)); }
  catch { throw new Error('Browser storage is unavailable or full. This change was not saved.'); }
}
function validate(dto) {
  if (!dto.title?.trim() || dto.title.length > 255 || (dto.description?.length || 0) > 2000) throw new Error('Check the title (1–255 characters) and details (up to 2000).');
  if (!['TODO','IN_PROGRESS','DONE'].includes(dto.status || 'TODO') || !['LOW','MEDIUM','HIGH'].includes(dto.priority || 'MEDIUM')) throw new Error('Choose a valid status and priority.');
}
async function mutate(action) {
  // Web Locks serializes writes across same-origin tabs when the browser supports it.
  const work = () => { const state = read(); const result = action(state.tasks, state); save(state); return result; };
  return navigator.locks ? navigator.locks.request(KEY, work) : work();
}
function find(tasks,id,version) {
  const task = tasks.find(t => t.id === id);
  if (!task) { const e = new Error('That task no longer exists. Refresh the hoard.'); e.status=404; throw e; }
  if (task.version !== version) { const e = new Error('Another tab changed this task. Close the form, refresh, and reopen it to edit the latest version.'); e.status=409; throw e; }
  return task;
}
export const demoStore = {
  async getTasks(filters) { return selectPage(read().tasks, filters); },
  async getSummary() { return summarize(read().tasks, localToday()); },
  async createTask(dto) {
    validate(dto);
    return mutate((tasks, state) => {
      const now = new Date().toISOString();
      const task = { id: state.nextId++, title:dto.title.trim(), description:dto.description?.trim() || '', status:dto.status || 'TODO', priority:dto.priority || 'MEDIUM', dueDate:dto.dueDate || null, version:0, createdAt:now, updatedAt:now, completedAt:dto.status==='DONE'?now:null, completed:dto.status==='DONE' };
      tasks.push(task); return task;
    });
  },
  async updateTask(id,dto) {
    validate(dto);
    return mutate((tasks, state) => {
      const task = find(tasks,id,dto.version), now = new Date().toISOString();
      const completedAt = dto.status === 'DONE' ? (task.status === 'DONE' ? task.completedAt : now) : null;
      Object.assign(task, { title:dto.title.trim(), description:dto.description?.trim() || '', priority:dto.priority, status:dto.status, dueDate:dto.dueDate || null, version:task.version+1, updatedAt:now, completedAt, completed:dto.status==='DONE' });
      return task;
    });
  },
  async deleteTask(id,version) { return mutate((tasks, state) => { find(tasks,id,version); tasks.splice(tasks.findIndex(t=>t.id===id),1); }); },
};

