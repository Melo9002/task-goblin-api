import { demoStore } from './demoStore.js';
import { localToday } from '../domain/taskRules.js';
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
async function request(path, options = {}) {
  let response;
  try { response = await fetch(`${BASE}/tasks${path}`, { ...options, headers: { 'Content-Type':'application/json' }, signal: AbortSignal.timeout(12000) }); }
  catch { throw new Error('The API isn’t answering. Check that Spring Boot is running. Refresh before retrying a save: it may have reached the server.'); }
  if (!response.ok) {
    const problem = await response.json().catch(()=>({}));
    const error = new Error(problem.errors ? Object.values(problem.errors).join(' ') : problem.detail || `Request failed (HTTP ${response.status}).`);
    error.status = response.status; throw error;
  }
  return response.status === 204 ? null : response.json();
}
const httpApi = {
  getTasks(filters = {}) {
    const params = new URLSearchParams();
    for (const [key,value] of Object.entries(filters)) {
      if (value === '' || value == null) continue;
      if (key === 'status' && value === 'OPEN') params.set('completed','false');
      else params.set(key,String(value));
    }
    return request(`?${params}`);
  },
  getSummary: () => request(`/summary?today=${localToday()}`),
  createTask: dto => request('', { method:'POST', body:JSON.stringify(dto) }),
  updateTask: (id,dto) => request(`/${id}`, { method:'PUT', body:JSON.stringify(dto) }),
  deleteTask: (id,version) => request(`/${id}?version=${version}`, { method:'DELETE' }),
};
export const taskApi = DEMO_MODE ? demoStore : httpApi;
