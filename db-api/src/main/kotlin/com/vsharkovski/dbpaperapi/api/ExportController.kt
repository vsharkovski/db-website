package com.vsharkovski.dbpaperapi.api

import com.vsharkovski.dbpaperapi.model.EExportJobStatus
import com.vsharkovski.dbpaperapi.service.ExportService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import javax.validation.Valid

@RestController
@RequestMapping("/api/export")
class ExportController(val exportService: ExportService) {
    @GetMapping
    fun getExportJobStatus(@RequestParam id: Long): ResponseEntity<ExportStatusResponse> {
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

    @PostMapping
    fun addExportJob(@Valid @RequestBody request: ExportRequest): ResponseEntity<ExportCreationResponse> {
        val job = exportService.createJob(request.term)
            ?: return ResponseEntity.badRequest().body(ExportCreationResponse(false, null))

        return ResponseEntity.ok(ExportCreationResponse(true, job.id))
    }
}