package com.taskgoblin.api.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

@Entity @Table(name = "tasks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Task {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String title;
    @Column(length = 2000)
    private String description;
    private LocalDate dueDate;
    @Column(nullable = false) @Enumerated(EnumType.STRING) @Builder.Default
    private TaskStatus status = TaskStatus.TODO;
    @Column(nullable = false) @Enumerated(EnumType.STRING) @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;
    @Version private Long version;
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
    private OffsetDateTime completedAt;
    @PrePersist public void prePersist() {
        createdAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS);
        updatedAt = createdAt;
    }
    @PreUpdate public void preUpdate() { updatedAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS); }
}
