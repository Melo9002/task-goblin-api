package com.taskgoblin.api.controller;

import com.taskgoblin.api.dto.TaskCreateDTO;
import com.taskgoblin.api.model.Task;
import com.taskgoblin.api.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@Valid @RequestBody TaskCreateDTO dto) {
        Task created = service.createTask(dto);
        URI location = URI.create("/tasks/" + created.getId());
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping
    public List<Task> listTasks() {
        return service.listTasks();
    }

    @PutMapping("/{id}/done")
    public Task markDone(@PathVariable Long id) {
        return service.markDone(id);
    }
}
