package com.taskgoblin.api.dto;
import java.util.List;
public record TaskPage(List<TaskResponse> items, int page, int size, long totalItems, int totalPages) {}
