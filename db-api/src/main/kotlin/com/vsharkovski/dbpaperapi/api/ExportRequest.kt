package com.vsharkovski.dbpaperapi.api

import javax.validation.constraints.NotBlank

data class ExportRequest(
    @field:NotBlank
    val term: String,
)
