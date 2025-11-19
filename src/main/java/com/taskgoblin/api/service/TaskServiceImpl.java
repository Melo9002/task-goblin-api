package com.taskgoblin.api.service;

import com.taskgoblin.api.dto.TaskCreateDTO;
import com.taskgoblin.api.model.Task;
import com.taskgoblin.api.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository repository;

    public TaskServiceImpl(TaskRepository repository) {
        this.repository = repository;
    }

    @Override
    public Task createTask(TaskCreateDTO dto) {
        Task t = Task.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .completed(false)
                .build();
        return repository.save(t);
    }

    @Override
    public List<Task> listTasks() {
        return repository.findAll();
    }

    @Override
    public Task markDone(Long id) {
        Task task = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Task not found"));
        if (!task.isCompleted()) {
            task.setCompleted(true);
            task = repository.save(task);
        }
        return task;
    }
}
