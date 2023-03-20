package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.EExportJobStatus
import com.vsharkovski.dbpaperapi.model.ExportJob
import com.vsharkovski.dbpaperapi.repository.ExportJobRepository
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.io.BufferedWriter
import java.nio.file.Files
import java.nio.file.Paths
import javax.transaction.Transactional

@Service
class ExportJobProcessor(val searchService: SearchService, val exportJobRepository: ExportJobRepository) {
    @Async
    @Transactional
    fun processJob(job: ExportJob) {
        // Query and write to file.
        queryJobSearchTermAndWriteToFile(job)

        // Update status to PROCESSED.
        exportJobRepository.save(job.copy(status = EExportJobStatus.PROCESSED))
    }

    private fun queryJobSearchTermAndWriteToFile(job: ExportJob) {
        val writer = getBufferedWriter(job.fileName)
        val stream = searchService.streamPeopleBySearchTerm(job.searchTerm)

        stream?.use {
            writer.use {
                stream.forEach {
                    writer.write(it.rawData)
                    writer.newLine()
                }
            }
        }
    }

    private fun getBufferedWriter(path: String): BufferedWriter {
        val filePath = Paths.get(path)
        Files.createDirectories(filePath.parent)
        return Files.newBufferedWriter(filePath)
    }
}