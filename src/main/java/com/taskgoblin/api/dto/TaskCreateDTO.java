package com.taskgoblin.api.dto;
import com.taskgoblin.api.model.TaskPriority;
import com.taskgoblin.api.model.TaskStatus;
import java.time.LocalDate;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
public record TaskCreateDTO(
    @NotBlank(message = "Title is required.")
    @Size(max = 255, message = "Title must be 255 characters or fewer.") @Schema(example = "Polish the portfolio") String title,
    @Size(max = 2000, message = "Description must be 2000 characters or fewer.") @Schema(example = "Add a screenshot and document the API.") String description,
    TaskPriority priority,
    TaskStatus status,
    @Schema(example = "2026-09-18") LocalDate dueDate
) {}
