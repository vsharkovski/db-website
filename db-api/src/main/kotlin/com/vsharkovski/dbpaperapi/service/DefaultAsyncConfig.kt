package com.vsharkovski.dbpaperapi.service

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.core.task.SimpleAsyncTaskExecutor
import org.springframework.core.task.TaskExecutor
import org.springframework.scheduling.annotation.EnableAsync

@Configuration
@EnableAsync
class DefaultAsyncConfig {
    @Primary
    @Bean
    fun taskExecutor(): TaskExecutor = SimpleAsyncTaskExecutor()
}