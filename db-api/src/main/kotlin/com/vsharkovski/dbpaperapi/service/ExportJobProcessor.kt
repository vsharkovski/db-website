package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.EExportJobStatus
import com.vsharkovski.dbpaperapi.model.ExportJob
import com.vsharkovski.dbpaperapi.repository.ExportJobRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.io.BufferedWriter
import java.nio.file.Files
import java.nio.file.Paths
import javax.annotation.PostConstruct
import javax.transaction.Transactional

@Service
class ExportJobProcessor(
    val searchService: SearchService,
    val exportJobRepository: ExportJobRepository
) {
    val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @Value("\${exporting.csv.header}")
    val csvHeaderResource: Resource? = null

    lateinit var csvHeader: String

    @PostConstruct
    fun init() {
        if (csvHeaderResource == null || !csvHeaderResource!!.exists()) {
            logger.error("CSV Header resource does not exist or failed to open.")
            return
        }

        val lines = csvHeaderResource!!.file.readLines()
        csvHeader = if (lines.isEmpty()) {
            logger.error("CSV Header resource file is empty.")
            ""
        } else {
            lines[0]
        }
        logger.info("CSV Header: [{}]", csvHeader)
    }

    @Async
    @Transactional
    fun processJob(job: ExportJob) {
        try {
            searchAndWriteToFile(job.searchTerm, job.filePath)

            // Update status to PROCESSED.
            exportJobRepository.save(job.copy(status = EExportJobStatus.PROCESS_SUCCESS))
        } catch (e: Exception) {
            // Some other error, either with file writing or database.
            logger.error("Failed exporting job [{}]: [{}]", job, e.message, e)
            exportJobRepository.save(job.copy(status = EExportJobStatus.PROCESS_FAIL))
        }
    }

    private fun searchAndWriteToFile(searchTerm: String, filePath: String) {
        val stream = searchService.streamPeopleBySearchTerm(searchTerm)
        val writer = createBufferedWriter(filePath)

        writer.use {
            // Write header on first line.
            writer.write(csvHeader)
            writer.newLine()

            // Write all results.
            stream?.forEach {
                writer.write(it.rawData)
                writer.newLine()
            }
        }
    }

    private fun createBufferedWriter(path: String): BufferedWriter {
        val filePath = Paths.get(path)
        Files.createDirectories(filePath.parent)
        return Files.newBufferedWriter(filePath)
    }
}