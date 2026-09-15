package com.taskgoblin.api.dto;
import com.taskgoblin.api.model.*;
import java.time.OffsetDateTime;
import java.time.LocalDate;
public record TaskResponse(Long id, String title, String description, TaskStatus status,
    TaskPriority priority, boolean completed, OffsetDateTime createdAt,
    OffsetDateTime updatedAt, OffsetDateTime completedAt, Long version, LocalDate dueDate) {
    public static TaskResponse from(Task t) {
        return new TaskResponse(t.getId(), t.getTitle(), t.getDescription(), t.getStatus(),
            t.getPriority(), t.getStatus() == TaskStatus.DONE, t.getCreatedAt(),
            t.getUpdatedAt(), t.getCompletedAt(), t.getVersion(), t.getDueDate());
    }
}
