package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.EExportJobStatus
import com.vsharkovski.dbpaperapi.model.ExportJob
import com.vsharkovski.dbpaperapi.repository.ExportJobRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.io.BufferedWriter
import java.nio.file.Files
import java.nio.file.Paths
import javax.transaction.Transactional

@Service
class ExportJobProcessor(val searchService: SearchService, val exportJobRepository: ExportJobRepository) {
    val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @Async
    @Transactional
    fun processJob(job: ExportJob) {
        try {
            val success = searchAndWriteToFile(job.searchTerm, job.fileName)
            if (success) {
                // Update status to PROCESSED.
                exportJobRepository.save(job.copy(status = EExportJobStatus.PROCESS_SUCCESS))
            } else {
                // Search term was not valid.
                exportJobRepository.save(job.copy(status = EExportJobStatus.PROCESS_FAIL_BAD_INPUT))
            }
        } catch (e: Exception) {
            // Some other error, either with file writing or database.
            logger.error("Failed exporting job [{}]: [{}]", job, e.message, e)
            exportJobRepository.save(job.copy(status = EExportJobStatus.PROCESS_FAIL_INTERNAL_ERROR))
        }
    }

    private fun searchAndWriteToFile(searchTerm: String, filePath: String): Boolean {
        // The search term should be valid. If not, return false.
        val stream = searchService.streamPeopleBySearchTerm(searchTerm) ?: return false
        val writer = getBufferedWriter(filePath)

        stream.use {
            writer.use {
                stream.forEach {
                    writer.write(it.rawData)
                    writer.newLine()
                }
            }
        }

        return true
    }

    private fun getBufferedWriter(path: String): BufferedWriter {
        val filePath = Paths.get(path)
        Files.createDirectories(filePath.parent)
        return Files.newBufferedWriter(filePath)
    }
}