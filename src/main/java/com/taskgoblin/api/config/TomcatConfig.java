package com.taskgoblin.api.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.*;

@Configuration
@ConditionalOnProperty(name = "taskgoblin.nio2", havingValue = "true")
public class TomcatConfig {
    // Optional Windows packaged-desktop compatibility: avoids NIO selector Unix-domain pipes.
    @Bean
    WebServerFactoryCustomizer<TomcatServletWebServerFactory> nio2Connector() {
        return factory -> factory.setProtocol("org.apache.coyote.http11.Http11Nio2Protocol");
    }
}
