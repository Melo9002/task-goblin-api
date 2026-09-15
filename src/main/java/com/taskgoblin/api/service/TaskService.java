package com.taskgoblin.api.service;
import com.taskgoblin.api.dto.*;
import java.util.List;
import java.time.LocalDate;
import com.taskgoblin.api.model.*;
public interface TaskService {
    TaskResponse createTask(TaskCreateDTO dto);
    TaskPage listTasks(String q, TaskStatus status, Boolean completed, TaskPriority priority, LocalDate dueBefore, int page, int size, String sort);
    TaskSummary summary(LocalDate today);
    TaskResponse getTask(Long id);
    TaskResponse updateTask(Long id, TaskUpdateDTO dto);
    TaskResponse markDone(Long id);
    void deleteTask(Long id, Long version);
}
