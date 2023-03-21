package com.vsharkovski.dbpaperapi.api

import com.vsharkovski.dbpaperapi.model.EExportJobStatus
import com.vsharkovski.dbpaperapi.service.ExportService
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
    @Value("\${exporting.path}")
    val exportPath: String = ""

    @GetMapping("/status/{id}")
    fun getExportJobStatus(@PathVariable id: Long): ResponseEntity<ExportStatusResponse> {
        val job = exportService.findJobById(id)
            ?: return ResponseEntity.badRequest().body(ExportStatusResponse("invalid id"))

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
            ?: return ResponseEntity.badRequest().body("Invalid file ID.")

        val resource = FileSystemResource("${exportPath}/${job.fileName}")
        if (!resource.exists()) {
            return ResponseEntity.internalServerError().body("Internal server error.")
        }

        // Make response be interpreted as a plaintext file.
        response.contentType = MediaType.TEXT_PLAIN_VALUE
        // Make response be interpreted as a file to be downloaded automatically.
        // Using 'inline' instead of attachment would display it in the browser.
        response.setHeader("Content-Disposition", "attachment; filename=export_result_${job.id}.csv")

        return ResponseEntity.ok(resource)
    }

    @PostMapping("/create")
    fun addExportJob(@Valid @RequestBody request: ExportRequest): ResponseEntity<ExportCreationResponse> {
        val job = exportService.createJob(request.term)
            ?: return ResponseEntity.badRequest().body(ExportCreationResponse(false, null))

        return ResponseEntity.ok(ExportCreationResponse(true, job.id))
    }
}