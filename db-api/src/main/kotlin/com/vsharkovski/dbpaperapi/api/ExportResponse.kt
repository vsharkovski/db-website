package com.vsharkovski.dbpaperapi.api

sealed interface ExportResponse

data class ExportStatusResponse(val status: String) : ExportResponse

data class ExportCreationResponse(val success: Boolean, val id: Long?) : ExportResponse
