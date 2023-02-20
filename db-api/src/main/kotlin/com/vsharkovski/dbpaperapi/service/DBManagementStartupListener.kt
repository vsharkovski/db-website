package com.vsharkovski.dbpaperapi.service

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.event.ContextRefreshedEvent
import org.springframework.context.event.EventListener
import org.springframework.core.io.FileSystemResource
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
            val resource = FileSystemResource(csvFilePath!!)
            if (resource.exists()) {
                csvService.addFileRelational(resource.file)
            } else {
                logger.error("Failed attempt to import relational database: file not found [{}]", csvFilePath)
            }
        }
        if (shouldImportRawDatabase && csvFilePath != null) {
            // Will only work if the relational database has already been imported.
            val resource = FileSystemResource(csvFilePath!!)
            if (resource.exists()) {
                csvService.addFileRaw(resource.file)
            } else {
                logger.error("Failed attempt to import raw database: file not found [{}]", csvFilePath)
            }
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