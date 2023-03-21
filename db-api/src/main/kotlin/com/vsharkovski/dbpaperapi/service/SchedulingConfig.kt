package com.vsharkovski.dbpaperapi.service

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.scheduling.TaskScheduler
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler

@Configuration
@EnableScheduling
class SchedulingConfig {
    @Primary
    @Bean
    fun taskScheduler(): TaskScheduler = ThreadPoolTaskScheduler()
}