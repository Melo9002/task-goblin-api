✔️ Task Goblin API — Initial README

# Task Goblin API

Task Goblin API is a minimal and clean task management REST API built with Spring Boot 3, Spring Web, Spring Data JPA, and H2 Database.  
It implements a simple layered architecture (controller → service → repository) and provides three core operations:

- Create a task
- List all tasks
- Mark a task as completed

This project serves as a compact example of a well-structured Spring Boot application using standard conventions and best practices.

---

## Technologies Used

- **Java 21**  
- **Spring Boot 3.x**  
- **Spring Web**
- **Spring Data JPA**
- **H2 Database (in-memory)**
- **Lombok**
- **Maven**

---

## Project Structure

```
src/main/java/com/taskgoblin/api
 ├── controller/
 ├── service/
 │     └── TaskService / TaskServiceImpl
 ├── repository/
 ├── model/
 │     └── Task.java
 ├── dto/
 │     └── TaskCreateDTO.java
 └── TaskGoblinApplication.java
```


---

## Endpoints

### 1. Create a task  
**POST** `/tasks`  
Request body:
```json
{
  "title": "Example task",
  "description": "Optional description"
}
```
---

2. List all tasks

GET /tasks


---

3. Mark a task as completed

PUT /tasks/{id}/done


---

Running the Application

Using Maven Wrapper

./mvnw spring-boot:run    (Linux/macOS)

mvnw.cmd spring-boot:run  (Windows)

The application starts on:

http://localhost:8080


---

H2 Console

The H2 in-memory database console is available at:

http://localhost:8080/h2-console

Use the following JDBC URL:

jdbc:h2:mem:taskgoblin

Username: sa
Password: (empty)


---

Example cURL Commands

Create a task:

curl -X POST http://localhost:8080/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Sample"}'

List tasks:

curl http://localhost:8080/tasks

Mark as done:

curl -X PUT http://localhost:8080/tasks/1/done


---
