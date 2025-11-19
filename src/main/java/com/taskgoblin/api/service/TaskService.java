package com.taskgoblin.api.service;

import com.taskgoblin.api.dto.TaskCreateDTO;
import com.taskgoblin.api.model.Task;

import java.util.List;

public interface TaskService {
    Task createTask(TaskCreateDTO dto);
    List<Task> listTasks();
    Task markDone(Long id);
}