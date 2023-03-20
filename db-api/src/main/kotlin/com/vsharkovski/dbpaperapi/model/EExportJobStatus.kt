package com.vsharkovski.dbpaperapi.model

enum class EExportJobStatus {
    UNPROCESSED,
    PROCESSING,
    PROCESS_SUCCESS,
    PROCESS_FAIL_BAD_INPUT,
    PROCESS_FAIL_INTERNAL_ERROR
}