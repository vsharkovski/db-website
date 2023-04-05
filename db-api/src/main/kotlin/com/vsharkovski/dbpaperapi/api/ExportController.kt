package com.vsharkovski.dbpaperapi.api

import com.vsharkovski.dbpaperapi.model.EExportJobStatus
import com.vsharkovski.dbpaperapi.service.ExportService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.FileSystemResource
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import javax.servlet.http.HttpServletResponse
import javax.validation.Valid

@RestController
@RequestMapping("/api/export")
class ExportController(val exportService: ExportService) {
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @Value("\${exporting.path}")
    val exportPath: String = ""

    @GetMapping("/status/{id}")
    fun getExportJobStatus(@PathVariable id: Long): ResponseEntity<ExportStatusResponse> {
        val job = exportService.findJobById(id)
            ?: return ResponseEntity.ok(ExportStatusResponse("invalid id"))

        val status = when (job.status) {
            EExportJobStatus.UNPROCESSED -> "unprocessed"
            EExportJobStatus.PROCESSING -> "processing"
            EExportJobStatus.PROCESS_SUCCESS -> "process success"
            EExportJobStatus.PROCESS_FAIL -> "process fail"
        }
        return ResponseEntity.ok(ExportStatusResponse(status))
    }

    @GetMapping("/file/{id}")
    fun getExportFile(@PathVariable id: Long, response: HttpServletResponse): ResponseEntity<Any> {
        val job = exportService.findJobById(id)
            ?: return ResponseEntity.badRequest().body("Could not find file. Most likely, it expired and was deleted from our system.")

        return when (job.status) {
            EExportJobStatus.UNPROCESSED, EExportJobStatus.PROCESSING ->
                ResponseEntity.badRequest().body("File is being created. Please check back soon.")

            EExportJobStatus.PROCESS_FAIL ->
                ResponseEntity.internalServerError().body("Internal server error. File could not be created.")

            EExportJobStatus.PROCESS_SUCCESS -> {
                val resource = FileSystemResource("${exportPath}/${job.fileName}.zip")
                if (!resource.exists()) {
                    logger.error("File for processed job was requested but could not be found: [{}]", job)
                    ResponseEntity.internalServerError().body("Internal server error. File could not be found.")
                } else {
                    // Make response be interpreted as a binary file.
                    response.contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE
                    // Make response be interpreted as a file to be downloaded automatically.
                    response.setHeader("Content-Disposition", "attachment; filename=export_result_${job.id}.zip")

                    ResponseEntity.ok(resource)
                }
            }
        }
    }

    @PostMapping("/create")
    fun addExportJob(@Valid @RequestBody request: ExportRequest): ResponseEntity<ExportCreationResponse> {
        val job = exportService.createJob(request.term)
            ?: return ResponseEntity.badRequest().body(ExportCreationResponse(false, null))

        return ResponseEntity.ok(ExportCreationResponse(true, job.id))
    }
}