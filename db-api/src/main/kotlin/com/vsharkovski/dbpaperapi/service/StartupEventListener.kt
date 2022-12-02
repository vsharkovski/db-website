package com.vsharkovski.dbpaperapi.service

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.event.ContextRefreshedEvent
import org.springframework.context.event.EventListener
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component

@Component
class StartupEventListener(
    val csvService: CSVService,
    val citizenshipService: CitizenshipService
) {
    private val logger = LoggerFactory.getLogger(StartupEventListener::class.java)

    @Value("\${database-management.import}")
    val importDatabase: Boolean = false

    @Value("\${database-management.clean-up-citizenship-names}")
    val cleanUpCitizenshipNames: Boolean = false

    @Value("\${database-management.clean-up-people-names}")
    val cleanUpPeopleNames: Boolean = false

    @Value("\${database-management.add-wiki-reader-count}")
    val addWikiReaderCount: Boolean = false

    @EventListener
    fun importDataset(event: ContextRefreshedEvent) {
        if (importDatabase) {
            val resource = ClassPathResource("/static/cross-verified-database.csv")
            csvService.addFile(resource.file)
        }
        if (cleanUpCitizenshipNames) {
            citizenshipService.cleanUpCitizenshipNames()
        }
        if (addWikiReaderCount) {
            val resource = ClassPathResource("/static/cross-verified-database.csv")
            csvService.addFileWikiReaderCounts(resource.file)
        }
    }
}