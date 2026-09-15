FROM node:22-alpine AS frontend
WORKDIR /ui
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm test && npm run build

FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /build
COPY pom.xml ./
COPY src/ ./src/
COPY --from=frontend /ui/dist/ ./frontend/dist/
RUN mvn --batch-mode verify

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S goblin && adduser -S goblin -G goblin && mkdir /app/data && chown goblin:goblin /app/data
COPY --from=backend /build/target/taskgoblin-1.0.0-SNAPSHOT.jar ./taskgoblin.jar
USER goblin
ENV SERVER_ADDRESS=0.0.0.0
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "taskgoblin.jar"]
