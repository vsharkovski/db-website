package com.vsharkovski.dbpaperapi.service

import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationListener
import org.springframework.context.event.ContextRefreshedEvent
import org.springframework.context.event.EventListener
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component

@Component
class StartupEventListener(
    val csvService: CSVService
) {
    private val logger = LoggerFactory.getLogger(StartupEventListener::class.java)

    private var firstEventHappened: Boolean = false

    @EventListener
    fun onApplicationEvent(event: ContextRefreshedEvent) {
        if (!firstEventHappened) {
            firstEventHappened = true
            val resource = ClassPathResource("/static/cross-verified-database.csv")
            val persons = csvService.save(resource.file)
        }
    }
}