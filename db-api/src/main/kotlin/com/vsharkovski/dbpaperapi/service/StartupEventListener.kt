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
    val citizenshipService: CitizenshipService,
    val occupationService: OccupationService,
    val personService: PersonService
) {
    private val logger = LoggerFactory.getLogger(StartupEventListener::class.java)

    @Value("\${database-management.import-all}")
    val shouldImportDatabase: Boolean = false

    @Value("\${database-management.import-notability-index}")
    val shouldImportNotabilityIndex: Boolean = false

    @Value("\${database-management.import-occupations}")
    val shouldImportOccupations: Boolean = false

    @Value("\${database-management.process-citizenship-names-readability}")
    val shouldProcessCitizenshipNamesReadability: Boolean = false

    @Value("\${database-management.process-citizenship-names-search}")
    val shouldProcessCitizenshipNamesSearch: Boolean = false

    @Value("\${database-management.process-person-names-search}")
    val shouldProcessPersonNamesSearch: Boolean = false

    @EventListener
    fun importDataset(event: ContextRefreshedEvent) {
        if (shouldImportDatabase) {
            val resource = ClassPathResource("/static/cross-verified-database.csv")
            csvService.addFile(resource.file)
        }
        if (shouldImportNotabilityIndex) {
            val resource = ClassPathResource("/static/cross-verified-database.csv")
            csvService.addNotabilityIndices(resource.file)
        }
        if (shouldImportOccupations) {
            val resource = ClassPathResource("/static/cross-verified-database.csv")
            csvService.addOccupations(resource.file)
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