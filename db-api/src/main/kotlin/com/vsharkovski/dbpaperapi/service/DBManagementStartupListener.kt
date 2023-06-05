package com.vsharkovski.dbpaperapi.service

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.event.ContextRefreshedEvent
import org.springframework.context.event.EventListener
import org.springframework.core.io.FileSystemResource
import org.springframework.stereotype.Component
import java.sql.Timestamp

@Component
class DBManagementStartupListener(
    val csvService: ImportService,
    val citizenshipService: CitizenshipService,
    val personService: PersonService,
    val exportService: ExportService
) {
    val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @Value("\${db-management.actions.import.all}")
    val shouldImportAll: Boolean = false

    @Value("\${db-management.actions.process.citizenship-names.readability}")
    val shouldProcessCitizenshipNamesReadability: Boolean = false

    @Value("\${db-management.actions.process.citizenship-names.search}")
    val shouldProcessCitizenshipNamesSearch: Boolean = false

    @Value("\${db-management.actions.process.person-names.search}")
    val shouldProcessPersonNamesSearch: Boolean = false

    @Value("\${db-management.csv-file-path}")
    val csvFilePath: String? = null

    @EventListener
    fun importDataset(event: ContextRefreshedEvent) {
        if (shouldImportAll) {
            assert(csvFilePath != null && csvFilePath != "no-file")
            val resource = FileSystemResource(csvFilePath!!)
            if (resource.exists()) {
                csvService.importAll(resource.file)
            } else {
                logger.error("Failed attempt to import relational database: file not found [{}]", csvFilePath)
            }
        }
        if (shouldProcessCitizenshipNamesSearch) {
            citizenshipService.processAllCitizenshipNamesForSearch()
        }
        if (shouldProcessCitizenshipNamesReadability) {
            citizenshipService.processAllCitizenshipNamesForReadability()
        }
        // Disabled for now.
        /*
        if (shouldProcessPersonNamesSearch) {
            personService.processAllPersonNamesForSearch()
        }
         */
    }

    @EventListener
    fun trackApplicationStartupTimestamp(event: ContextRefreshedEvent) {
        exportService.currentApplicationStartupTimestamp = Timestamp(System.currentTimeMillis())
    }
}