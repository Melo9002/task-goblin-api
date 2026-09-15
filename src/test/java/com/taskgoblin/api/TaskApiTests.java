package com.taskgoblin.api;

import com.fasterxml.jackson.databind.*;
import com.taskgoblin.api.repository.TaskRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc
class TaskApiTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired TaskRepository repository;

    @BeforeEach void clearDatabase() { repository.deleteAll(); }

    private JsonNode create(String title) throws Exception {
        return json.readTree(mvc.perform(post("/tasks").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("title", title))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }
    private String updateBody(JsonNode task, String status) throws Exception {
        return json.writeValueAsString(Map.of("title", task.get("title").asText(),
            "description", "A useful detail", "priority", "HIGH", "status", status,
            "version", task.get("version").asLong()));
    }

    @Test void createsTaskWithDefaultsAndResolvableLocation() throws Exception {
        var result = mvc.perform(post("/tasks").contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"  Plant a tree  \"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.title").value("Plant a tree"))
            .andExpect(jsonPath("$.status").value("TODO"))
            .andExpect(jsonPath("$.priority").value("MEDIUM"))
            .andExpect(jsonPath("$.completed").value(false))
            .andExpect(jsonPath("$.version").value(0))
            .andExpect(jsonPath("$.createdAt").isNotEmpty()).andReturn();
        mvc.perform(get(result.getResponse().getHeader("Location")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Plant a tree"));
    }

    @Test void rejectsMissingAndBlankTitlesWithFieldErrors() throws Exception {
        for (String body : new String[]{"{}", "{\"title\":\"   \"}", "{\"title\":null}"})
            mvc.perform(post("/tasks").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.errors.title").exists());
        assertThat(repository.count()).isZero();
    }

    @Test void validatesBothTextLimitsBeforePersistence() throws Exception {
        for (var body : new Map[]{Map.of("title", "x".repeat(256)),
            Map.of("title", "Good title", "description", "x".repeat(2001))})
            mvc.perform(post("/tasks").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/tasks").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("title", "x".repeat(255), "description", "x".repeat(2000)))))
            .andExpect(status().isCreated());
    }

    @Test void listsNewestFirst() throws Exception {
        create("First quest"); create("Second quest");
        mvc.perform(get("/tasks")).andExpect(status().isOk())
            .andExpect(jsonPath("$.totalItems").value(2))
            .andExpect(jsonPath("$.items[0].title").value("Second quest"));
    }

    @Test void supportsFullLifecycleAndClearsCompletionOnReopen() throws Exception {
        var task = create("A tiny quest");
        var result = mvc.perform(put("/tasks/" + task.get("id")).contentType(MediaType.APPLICATION_JSON)
            .content(updateBody(task, "IN_PROGRESS")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.priority").value("HIGH"))
            .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
            .andExpect(jsonPath("$.version").value(1)).andReturn();
        task = json.readTree(result.getResponse().getContentAsString());
        result = mvc.perform(put("/tasks/" + task.get("id")).contentType(MediaType.APPLICATION_JSON)
            .content(updateBody(task, "DONE"))).andExpect(status().isOk())
            .andExpect(jsonPath("$.completed").value(true))
            .andExpect(jsonPath("$.completedAt").isNotEmpty()).andReturn();
        task = json.readTree(result.getResponse().getContentAsString());
        mvc.perform(put("/tasks/" + task.get("id")).contentType(MediaType.APPLICATION_JSON)
            .content(updateBody(task, "TODO"))).andExpect(status().isOk())
            .andExpect(jsonPath("$.completed").value(false))
            .andExpect(jsonPath("$.completedAt").isEmpty());
    }

    @Test void legacyDoneEndpointIsIdempotent() throws Exception {
        var task = create("Bonk once");
        var first = mvc.perform(put("/tasks/" + task.get("id") + "/done"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var second = mvc.perform(put("/tasks/" + task.get("id") + "/done"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(second)).isEqualTo(json.readTree(first));
    }

    @Test void staleUpdateAndDeleteCannotOverwriteNewerWork() throws Exception {
        var task = create("Original");
        mvc.perform(put("/tasks/" + task.get("id") + "/done")).andExpect(status().isOk());
        mvc.perform(put("/tasks/" + task.get("id")).contentType(MediaType.APPLICATION_JSON)
            .content(updateBody(task, "TODO"))).andExpect(status().isConflict());
        mvc.perform(delete("/tasks/" + task.get("id")).param("version", "0"))
            .andExpect(status().isConflict());
        mvc.perform(get("/tasks/" + task.get("id")))
            .andExpect(jsonPath("$.completed").value(true));
    }

    @Test void deletesTaskAndThenReturnsNotFound() throws Exception {
        var task = create("Let it go");
        mvc.perform(delete("/tasks/" + task.get("id")).param("version", "0"))
            .andExpect(status().isNoContent()).andExpect(content().string(""));
        mvc.perform(get("/tasks/" + task.get("id"))).andExpect(status().isNotFound());
    }

    @Test void unknownIdsReturn404AcrossOperations() throws Exception {
        mvc.perform(get("/tasks/999999")).andExpect(status().isNotFound());
        mvc.perform(put("/tasks/999999/done")).andExpect(status().isNotFound());
        mvc.perform(delete("/tasks/999999").param("version", "0")).andExpect(status().isNotFound());
        mvc.perform(put("/tasks/999999").contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"Missing\",\"status\":\"TODO\",\"priority\":\"LOW\",\"version\":0}"))
            .andExpect(status().isNotFound());
    }

    @Test void rejectsMalformedJsonInvalidEnumsAndMissingVersion() throws Exception {
        for (String body : new String[]{"{", "{\"title\":\"Hi\",\"priority\":\"BANANA\"}"})
            mvc.perform(post("/tasks").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        var task = create("Valid");
        mvc.perform(put("/tasks/" + task.get("id")).contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"Valid\",\"status\":\"TODO\",\"priority\":\"LOW\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.version").exists());
        mvc.perform(delete("/tasks/" + task.get("id"))).andExpect(status().isBadRequest());
    }

    @Test void servesTheUiAndKeepsDatabaseConsoleDisabled() throws Exception {
        mvc.perform(get("/index.html")).andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML));
        mvc.perform(get("/assets/workshop.svg")).andExpect(status().isOk());
        mvc.perform(get("/h2-console")).andExpect(status().isNotFound());
    }

    @Test void dueDatesFilteringAndPrioritySortingWorkTogether() throws Exception {
        for (var body : new Map[]{
            Map.of("title","Portfolio A","priority","LOW","dueDate","2026-09-18"),
            Map.of("title","Portfolio B","priority","HIGH","dueDate","2026-09-17"),
            Map.of("title","Unrelated","priority","HIGH")})
            mvc.perform(post("/tasks").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isCreated());
        mvc.perform(get("/tasks").param("q","portfolio").param("sort","priority,asc").param("size","1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(2))
            .andExpect(jsonPath("$.totalPages").value(2))
            .andExpect(jsonPath("$.items[0].title").value("Portfolio B"));
        mvc.perform(get("/tasks").param("priority","HIGH").param("dueBefore","2026-09-18").param("completed","false"))
            .andExpect(jsonPath("$.totalItems").value(1));
        mvc.perform(get("/tasks").param("sort","dueDate,asc"))
            .andExpect(jsonPath("$.items[2].title").value("Unrelated"));
        mvc.perform(get("/tasks/summary").param("today","2026-09-18"))
            .andExpect(jsonPath("$.total").value(3)).andExpect(jsonPath("$.overdue").value(1));
    }

    @Test void rejectsInvalidPaginationSortAndDates() throws Exception {
        mvc.perform(get("/tasks").param("page","-1")).andExpect(status().isBadRequest());
        mvc.perform(get("/tasks").param("size","101")).andExpect(status().isBadRequest());
        mvc.perform(get("/tasks").param("sort","password,desc")).andExpect(status().isBadRequest());
        mvc.perform(post("/tasks").contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"Bad date\",\"dueDate\":\"not-a-date\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test void dateCanBeClearedAndSearchTreatsWildcardsLiterally() throws Exception {
        var task = json.readTree(mvc.perform(post("/tasks").contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"100% done\",\"dueDate\":\"2026-09-18\",\"status\":\"DONE\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.completedAt").isNotEmpty())
            .andReturn().getResponse().getContentAsString());
        create("Another task");
        mvc.perform(get("/tasks").param("q","%"))
            .andExpect(jsonPath("$.totalItems").value(1));
        mvc.perform(put("/tasks/"+task.get("id")).contentType(MediaType.APPLICATION_JSON).content(updateBody(task,"TODO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.dueDate").isEmpty());
    }

    @Test void publishesOpenApiDocumentation() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
            .andExpect(jsonPath("$.info.title").value("Task Goblin API"))
            .andExpect(jsonPath("$.paths['/tasks/{id}'].put").exists());
    }
}
