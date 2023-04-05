package com.vsharkovski.dbpaperapi.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.task.SyncTaskExecutor
import org.springframework.core.task.TaskExecutor
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import java.util.concurrent.ThreadPoolExecutor

@Configuration
@EnableAsync
class ImportAsyncConfig {
    @Value("\${db-management.threading.multithreaded}")
    val shouldMultithread: Boolean = false

    @Value("\${db-management.threading.threads}")
    val threadCount: Int = 1

    @Value("\${db-management.threading.queue-capacity}")
    val queueCapacity: Int = 1000

    @Bean
    fun importTaskExecutor(): TaskExecutor {
        return if (shouldMultithread) {
            val executor = ThreadPoolTaskExecutor()
            executor.queueCapacity = queueCapacity
            executor.maxPoolSize = if (threadCount < 0) Int.MAX_VALUE else threadCount
            executor.setRejectedExecutionHandler(ThreadPoolExecutor.CallerRunsPolicy())
            executor.initialize()
            executor
        } else {
            SyncTaskExecutor()
        }
    }
}