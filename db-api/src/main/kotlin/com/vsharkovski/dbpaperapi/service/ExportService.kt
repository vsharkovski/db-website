package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.EExportJobStatus
import com.vsharkovski.dbpaperapi.model.ExportJob
import com.vsharkovski.dbpaperapi.repository.ExportJobRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Async
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.sql.Timestamp
import kotlin.time.Duration.Companion.minutes

@Service
class ExportService(
    val exportJobRepository: ExportJobRepository
) {
    private val logger: Logger = LoggerFactory.getLogger(ExportService::class.java)

    @Value("\${exporting.path}")
    val exportPath: String = ""

    /*
    Used to track which jobs are processing in the current application.
    If a job has a processingStartTimestamp that is not this one,
    it means its processing was started in a previous application which
    crashed or was killed. Such jobs should be discarded.
     */
    final var currentApplicationStartupTimestamp: Timestamp? = null
        set(value) {
            if (field == null) field = value
        }

    fun createJob(term: String) {
        val job = ExportJob(searchTerm = term, status = EExportJobStatus.UNPROCESSED)
        exportJobRepository.save(job)
    }

    @Scheduled(fixedDelay = 3000)
    fun processAllJobs() {
        processUnprocessedJobs()
        discardUnfinishedProcessingJobs()
        discardExpiredJobs()
    }

    private fun processUnprocessedJobs() {
        // Start exporting process for new jobs.
        for (job in exportJobRepository.findExportJobsByStatus(EExportJobStatus.UNPROCESSED)) {
            processUnprocessedJob(job)
        }
    }

    @Async
    fun processUnprocessedJob(job: ExportJob) {
        assert(job.status == EExportJobStatus.UNPROCESSED)

        // Update status to PROCESSING.
        job.status = EExportJobStatus.PROCESSING
        exportJobRepository.save(job)

        searchAndWriteToFile(job.searchTerm, "${exportPath}/${job.id}.csv")

        // Update status to PROCESSED.
        job.status = EExportJobStatus.PROCESSED
        exportJobRepository.save(job)
    }

    private fun searchAndWriteToFile(searchTerm: String, filePath: String) {
        // Open file.
        // Query database and stream writing results to file.
    }

    private fun discardUnfinishedProcessingJobs() {
        // Discard jobs that were started to be processed but never finished, due to an application crash or kill.
        assert(currentApplicationStartupTimestamp != null)
        for (job in exportJobRepository.findExportJobsByStatus(EExportJobStatus.PROCESSING)) {
            if (job.updateTime.before(currentApplicationStartupTimestamp)) {
                exportJobRepository.delete(job)
            }
        }
    }

    private fun discardExpiredJobs() {
        // Discard jobs that finished processing more than 10 minutes ago.
        // Also delete their files.
        val currentMoment = Timestamp(System.currentTimeMillis())

        for (job in exportJobRepository.findExportJobsByStatus((EExportJobStatus.PROCESSED))) {
            val expirationMoment = Timestamp(job.updateTime.time + (10L).minutes.inWholeMilliseconds)
            if (expirationMoment.before(currentMoment)) {
                exportJobRepository.delete(job)
            }
        }

        // Possible problem: what if user is downloading the file when it is deleted.
        // Possible exploit: downloading a file with a slow connection to prevent deleting it.
    }
}