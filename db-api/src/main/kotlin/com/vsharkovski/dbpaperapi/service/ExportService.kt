package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.EExportJobStatus
import com.vsharkovski.dbpaperapi.model.ExportJob
import com.vsharkovski.dbpaperapi.repository.ExportJobRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.repository.findByIdOrNull
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Paths
import java.sql.Timestamp
import java.util.*
import kotlin.time.Duration.Companion.minutes

@Service
class ExportService(
    val exportJobRepository: ExportJobRepository,
    val exportJobProcessor: ExportJobProcessor,
    val searchService: SearchService
) {
    val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @Value("\${exporting.job.lifetime}")
    val jobLifetimeMinutes: Long? = null

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

    fun findJobById(id: Long): ExportJob? = exportJobRepository.findByIdOrNull(id)

    fun createJob(term: String): ExportJob? {
        if (!searchService.isSearchTermValid(term)) {
            return null
        }

        val uuid = UUID.randomUUID()
        val job = ExportJob(
            searchTerm = term,
            status = EExportJobStatus.UNPROCESSED,
            fileName = uuid.toString()
        )
        return exportJobRepository.save(job)
    }

    // TODO: All processing should be in a single method and in a single big transaction?
    // TODO: And individual job processing should be in another new transaction?

    @Scheduled(fixedDelay = 3000)
    fun processJobs() {
        discardUnfinishedProcessingJobs()
        discardExpiredJobs()
        startProcessingUnprocessedJobs()
    }

    // Start exporting process for new jobs.
    private fun startProcessingUnprocessedJobs() {
        for (job in exportJobRepository.findExportJobsByStatus(EExportJobStatus.UNPROCESSED)) {
            // Update status to PROCESSING.
            exportJobRepository.save(job.copy(status = EExportJobStatus.PROCESSING))

            // Start processing in another thread.
            // Has to use another service because @Async and @Transactional methods can't be called inside same class.
            exportJobProcessor.processJob(job)
        }
    }

    // Discard jobs that were started to be processed but never finished, due to an application crash or kill.
    private fun discardUnfinishedProcessingJobs() {
        assert(currentApplicationStartupTimestamp != null)

        for (job in exportJobRepository.findExportJobsByStatus(EExportJobStatus.PROCESSING)) {
            if (job.updateTime.before(currentApplicationStartupTimestamp)) {
                discardJob(job)
            }
        }
    }

    // Discard jobs that finished processing more than 10 minutes ago.
    private fun discardExpiredJobs() {
        assert(jobLifetimeMinutes != null)
        val currentMoment = Timestamp(System.currentTimeMillis())

        val successes = exportJobRepository.findExportJobsByStatus(EExportJobStatus.PROCESS_SUCCESS)
        val fails = exportJobRepository.findExportJobsByStatus(EExportJobStatus.PROCESS_FAIL)

        for (job in listOf(successes, fails).flatten()) {
            val expirationMoment = Timestamp(
                job.updateTime.time + jobLifetimeMinutes!!.minutes.inWholeMilliseconds
            )
            if (expirationMoment.before(currentMoment)) {
                discardJob(job)
            }
        }

        // TODO: Possible problem: what if user is downloading the file when it is deleted.
        // TODO: Possible exploit: downloading a file with a slow connection to prevent deleting it.
    }

    private fun discardJob(job: ExportJob) {
        deleteJobFile(job)

        // Remove from database.
        exportJobRepository.delete(job)
    }

    private fun deleteJobFile(job: ExportJob) {
        try {
            val filePath = Paths.get("${exportPath}/${job.fileName}.csv")
            Files.delete(filePath)
        } catch (e: Exception) {
            logger.info("Failed to delete file for job [{}]: [{}]", job, e.message, e)
        }
    }
}