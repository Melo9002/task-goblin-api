package com.taskgoblin.api.controller;
import com.taskgoblin.api.dto.*;
import com.taskgoblin.api.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;
import java.time.LocalDate;
import com.taskgoblin.api.model.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;

@RestController @RequestMapping("/tasks")
@Tag(name = "Tasks", description = "Create, organize, complete and reopen tasks")
public class TaskController {
    private final TaskService service;
    public TaskController(TaskService service) { this.service = service; }
    @PostMapping
    @Operation(summary = "Create a task", responses = {@ApiResponse(responseCode = "201", description = "Created; Location points to the task"), @ApiResponse(responseCode = "400", description = "Invalid fields")})
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskCreateDTO dto) {
        TaskResponse created = service.createTask(dto);
        return ResponseEntity.created(URI.create("/tasks/" + created.id())).body(created);
    }
    @GetMapping
    @Operation(summary = "Search, filter, sort and paginate tasks", description = "Zero-based pages; size 1–100. Sort: createdAt, updatedAt, dueDate, priority or title followed by asc/desc. Priority ascending means HIGH first. Undated tasks sort last. dueBefore is inclusive. Filters combine with AND.")
    public TaskPage listTasks(@RequestParam(required = false) String q,
        @RequestParam(required = false) TaskStatus status, @RequestParam(required = false) Boolean completed,
        @RequestParam(required = false) TaskPriority priority, @RequestParam(required = false) LocalDate dueBefore,
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size,
        @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return service.listTasks(q, status, completed, priority, dueBefore, page, size, sort);
    }
    @GetMapping("/summary") @Operation(summary = "Get unfiltered workload counts", description = "today defaults to the server's local date; clients can provide their local date for overdue counts.")
    public TaskSummary summary(@RequestParam(required = false) LocalDate today) { return service.summary(today == null ? LocalDate.now() : today); }
    @Operation(summary = "Get one task", responses = {@ApiResponse(responseCode = "200", description = "Task found"), @ApiResponse(responseCode = "404", description = "Task not found")})
    @GetMapping("/{id}") public TaskResponse getTask(@PathVariable Long id) { return service.getTask(id); }
    @Operation(summary = "Complete a task", description = "Idempotent legacy action. For optimistic concurrency, update the task with status DONE and its current version.")
    @PutMapping("/{id}/done") public TaskResponse markDone(@PathVariable Long id) { return service.markDone(id); }
    @PutMapping("/{id}")
    @Operation(summary = "Replace editable task fields", description = "Requires the version from the latest read. Use status TODO to reopen. Omitted dueDate clears it.", responses = {@ApiResponse(responseCode = "200", description = "Updated"), @ApiResponse(responseCode = "400", description = "Invalid fields"), @ApiResponse(responseCode = "404", description = "Task not found"), @ApiResponse(responseCode = "409", description = "Stale version")})
    public TaskResponse updateTask(@PathVariable Long id, @Valid @RequestBody TaskUpdateDTO dto) {
        return service.updateTask(id, dto);
    }
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a task", responses = {@ApiResponse(responseCode = "204", description = "Deleted"), @ApiResponse(responseCode = "404", description = "Task not found"), @ApiResponse(responseCode = "409", description = "Stale version")})
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, @RequestParam Long version) {
        service.deleteTask(id, version);
        return ResponseEntity.noContent().build();
    }
}
