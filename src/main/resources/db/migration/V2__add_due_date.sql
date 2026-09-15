ALTER TABLE tasks ADD COLUMN due_date DATE;
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
