package com.nuvaya.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Value("${nuvaya.storage.upload-dir}") private String uploadDir;
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String loc = Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/uploads/**").addResourceLocations(loc);
    }
}
