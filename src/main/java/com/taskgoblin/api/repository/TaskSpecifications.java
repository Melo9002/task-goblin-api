package com.taskgoblin.api.repository;

import com.taskgoblin.api.model.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.server.ResponseStatusException;
import jakarta.persistence.criteria.*;
import java.time.LocalDate;
import java.util.*;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

public final class TaskSpecifications {
    private TaskSpecifications() {}

    public static Specification<Task> matching(String q, TaskStatus status, Boolean completed,
            TaskPriority priority, LocalDate dueBefore, String sort) {
        String[] parts = sort.split(",", -1);
        String field = parts[0];
        String direction = parts.length == 1 ? "asc" : parts[1];
        if (parts.length > 2 || !Set.of("createdAt", "updatedAt", "dueDate", "priority", "title").contains(field)
                || !Set.of("asc", "desc").contains(direction))
            throw new ResponseStatusException(BAD_REQUEST, "Sort must be field,asc or field,desc. Allowed fields: createdAt, updatedAt, dueDate, priority, title.");
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String escaped = q.strip().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
                String pattern = "%" + escaped + "%";
                predicates.add(cb.or(cb.like(cb.lower(root.get("title")), pattern, '\\'),
                    cb.like(cb.lower(root.get("description")), pattern, '\\')));
            }
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (completed != null) predicates.add(completed ? cb.equal(root.get("status"), TaskStatus.DONE) : cb.notEqual(root.get("status"), TaskStatus.DONE));
            if (priority != null) predicates.add(cb.equal(root.get("priority"), priority));
            if (dueBefore != null) predicates.add(cb.lessThanOrEqualTo(root.get("dueDate"), dueBefore));
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                Expression<?> expression = root.get(field);
                List<Order> orders = new ArrayList<>();
                if (field.equals("priority")) expression = cb.<Integer>selectCase()
                    .when(cb.equal(root.get("priority"), TaskPriority.HIGH), 0)
                    .when(cb.equal(root.get("priority"), TaskPriority.MEDIUM), 1).otherwise(2);
                if (field.equals("dueDate")) orders.add(cb.asc(cb.<Integer>selectCase().when(cb.isNull(root.get("dueDate")), 1).otherwise(0)));
                orders.add(direction.equals("asc") ? cb.asc(expression) : cb.desc(expression));
                orders.add(cb.desc(root.get("id")));
                query.orderBy(orders);
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
