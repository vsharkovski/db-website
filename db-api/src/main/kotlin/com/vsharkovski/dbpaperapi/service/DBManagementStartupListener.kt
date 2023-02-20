package com.vsharkovski.dbpaperapi.service

import org.slf4j.Logger
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
    val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @Value("\${db-management.import.relational-all}")
    val shouldImportRelationalDatabase: Boolean = false

    @Value("\${db-management.import.raw-all}")
    val shouldImportRawDatabase: Boolean = false

    @Value("\${db-management.process.citizenship-names.readability}")
    val shouldProcessCitizenshipNamesReadability: Boolean = false

    @Value("\${db-management.process.citizenship-names.search}")
    val shouldProcessCitizenshipNamesSearch: Boolean = false

    @Value("\${db-management.process.person-names.search}")
    val shouldProcessPersonNamesSearch: Boolean = false

    @Value("\${db-management.csv-file-path}")
    val csvFilePath: String? = null

    @EventListener
    fun importDataset(event: ContextRefreshedEvent) {
        if (shouldImportRelationalDatabase && csvFilePath != null) {
            val resource = ClassPathResource(csvFilePath!!)
            csvService.addFileRelational(resource.file)
        }
        if (shouldImportRawDatabase && csvFilePath != null) {
            // Will only work if the relational database has already been imported.
            val resource = ClassPathResource(csvFilePath!!)
            csvService.addFileRaw(resource.file)
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