package com.vsharkovski.dbpaperapi.service

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.event.ContextRefreshedEvent
import org.springframework.context.event.EventListener
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component

@Component
class DBManagementStartupListener(
    val csvService: CSVService,
    val citizenshipService: CitizenshipService,
    val personService: PersonService
) {
    private val logger = LoggerFactory.getLogger(DBManagementStartupListener::class.java)

    @Value("\${database-management.import.relational-all}")
    val shouldImportRelationalDatabase: Boolean = false

    @Value("\${database-management.import.raw-all}")
    val shouldImportRawDatabase: Boolean = false

    @Value("\${database-management.process.citizenship-names.readability}")
    val shouldProcessCitizenshipNamesReadability: Boolean = false

    @Value("\${database-management.process.citizenship-names.search}")
    val shouldProcessCitizenshipNamesSearch: Boolean = false

    @Value("\${database-management.process.person-names.search}")
    val shouldProcessPersonNamesSearch: Boolean = false

    @EventListener
    fun importDataset(event: ContextRefreshedEvent) {
        if (shouldImportRelationalDatabase) {
            val resource = ClassPathResource("/static/cross-verified-database.csv")
            csvService.addFile(resource.file)
        }
        if (shouldImportRawDatabase) {

        }
        if (shouldProcessCitizenshipNamesSearch) {
            citizenshipService.processAllCitizenshipNamesForSearch()
        }
        if (shouldProcessCitizenshipNamesReadability) {
            citizenshipService.processAllCitizenshipNamesForReadability()
        }
        if (shouldProcessPersonNamesSearch) {
            personService.processAllPersonNamesForSearch()
        }
    }
}