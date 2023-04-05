package com.vsharkovski.dbpaperapi.repository

import com.vsharkovski.dbpaperapi.model.EExportJobStatus
import com.vsharkovski.dbpaperapi.model.ExportJob
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ExportJobRepository : JpaRepository<ExportJob, Long> {
    fun findExportJobsByStatus(status: EExportJobStatus): List<ExportJob>
}