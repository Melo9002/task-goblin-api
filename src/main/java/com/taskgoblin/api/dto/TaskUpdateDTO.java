package com.taskgoblin.api.dto;
import com.taskgoblin.api.model.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
public record TaskUpdateDTO(
    @NotBlank(message = "Title is required.") @Size(max = 255) String title,
    @Size(max = 2000) String description,
    @NotNull TaskStatus status,
    @NotNull TaskPriority priority,
    @NotNull @PositiveOrZero Long version,
    LocalDate dueDate
) {}
