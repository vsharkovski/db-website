package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.EExportJobStatus
import com.vsharkovski.dbpaperapi.model.ExportJob
import com.vsharkovski.dbpaperapi.repository.ExportJobRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.io.BufferedWriter
import java.nio.file.Files
import java.nio.file.Paths
import javax.transaction.Transactional

@Service
class ExportJobProcessor(
    val searchService: SearchService,
    val exportJobRepository: ExportJobRepository
) {
    val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @Value("\${exporting.path}")
    val exportPath: String = ""

    @Async
    @Transactional
    fun processJob(job: ExportJob) {
        try {
            searchAndWriteToFile(job.searchTerm, "${exportPath}/${job.fileName}")

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

        stream.use {
            writer.use {
                stream?.forEach {
                    writer.write(it.rawData)
                    writer.newLine()
                }
            }
        }
    }

    private fun createBufferedWriter(path: String): BufferedWriter {
        val filePath = Paths.get(path)
        Files.createDirectories(filePath.parent)
        return Files.newBufferedWriter(filePath)
    }
}