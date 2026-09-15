package com.taskgoblin.api.config;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.*;
@Configuration
public class OpenApiConfig {
    @Bean public OpenAPI taskGoblinApi() {
        return new OpenAPI().info(new Info().title("Task Goblin API").version("1.0.0")
            .description("A small task-management API with validated DTOs, optimistic concurrency and persistent storage. GET /tasks returns a page envelope (items, page, size, totalItems, totalPages). Errors use application/problem+json. Dates use YYYY-MM-DD; timestamps include an offset."));
    }
}
