package com.vsharkovski.dbpaperapi.model

import org.springframework.data.domain.Sort

data class SortState(
    val variable: String,
    val direction: Sort.Direction
)
