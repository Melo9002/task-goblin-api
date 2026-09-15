package com.taskgoblin.api.service;
import com.taskgoblin.api.dto.*;
import com.taskgoblin.api.model.*;
import com.taskgoblin.api.repository.TaskRepository;
import com.taskgoblin.api.repository.TaskSpecifications;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import static org.springframework.http.HttpStatus.*;

@Service @Transactional
public class TaskServiceImpl implements TaskService {
    private final TaskRepository repository;
    public TaskServiceImpl(TaskRepository repository) { this.repository = repository; }
    public TaskResponse createTask(TaskCreateDTO dto) {
        Task task = Task.builder().title(dto.title().strip()).description(clean(dto.description())).dueDate(dto.dueDate())
            .priority(dto.priority() == null ? TaskPriority.MEDIUM : dto.priority()).build();
        if (dto.status() != null) changeStatus(task, dto.status());
        return TaskResponse.from(repository.saveAndFlush(task));
    }
    @Transactional(readOnly = true)
    public TaskPage listTasks(String q, TaskStatus status, Boolean completed, TaskPriority priority, LocalDate dueBefore, int page, int size, String sort) {
        if (page < 0 || size < 1 || size > 100) throw new ResponseStatusException(BAD_REQUEST, "Page must be zero or greater, and size must be between 1 and 100.");
        if (q != null && q.length() > 255) throw new ResponseStatusException(BAD_REQUEST, "Search must be 255 characters or fewer.");
        var result = repository.findAll(TaskSpecifications.matching(q, status, completed, priority, dueBefore, sort), PageRequest.of(page, size));
        return new TaskPage(result.getContent().stream().map(TaskResponse::from).toList(), page, size, result.getTotalElements(), result.getTotalPages());
    }
    @Transactional(readOnly = true)
    public TaskSummary summary(LocalDate today) {
        long total = repository.count(), done = repository.countByStatus(TaskStatus.DONE);
        return new TaskSummary(total, total - done, repository.countByStatus(TaskStatus.IN_PROGRESS), done,
            repository.countByDueDateBeforeAndStatusNot(today, TaskStatus.DONE));
    }
    @Transactional(readOnly = true)
    public TaskResponse getTask(Long id) { return TaskResponse.from(find(id)); }
    public TaskResponse updateTask(Long id, TaskUpdateDTO dto) {
        Task task = find(id);
        checkVersion(task, dto.version());
        task.setTitle(dto.title().strip());
        task.setDescription(clean(dto.description()));
        task.setDueDate(dto.dueDate());
        task.setPriority(dto.priority());
        changeStatus(task, dto.status());
        return TaskResponse.from(repository.saveAndFlush(task));
    }
    public TaskResponse markDone(Long id) {
        Task task = find(id);
        changeStatus(task, TaskStatus.DONE);
        return TaskResponse.from(repository.saveAndFlush(task));
    }
    public void deleteTask(Long id, Long version) {
        Task task = find(id);
        checkVersion(task, version);
        repository.delete(task);
        repository.flush();
    }
    private Task find(Long id) {
        return repository.findById(id).orElseThrow(() ->
            new ResponseStatusException(NOT_FOUND, "Task " + id + " was not found."));
    }
    private void checkVersion(Task task, Long version) {
        if (!Objects.equals(task.getVersion(), version))
            throw new ResponseStatusException(CONFLICT,
                "Task was updated by another request. Refresh and retry with the latest version.");
    }
    private void changeStatus(Task task, TaskStatus status) {
        if (task.getStatus() != status) {
            task.setStatus(status);
            task.setCompletedAt(status == TaskStatus.DONE ? OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS) : null);
        }
    }
    private String clean(String value) { return value == null ? "" : value.strip(); }
}
