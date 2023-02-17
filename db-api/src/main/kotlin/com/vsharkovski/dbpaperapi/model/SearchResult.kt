package com.vsharkovski.dbpaperapi.model

import org.springframework.data.domain.Sort

data class SearchResult<T>(
    val results: List<T> = emptyList(),
    val hasPreviousPage: Boolean = false,
    val hasNextPage: Boolean = false,
    val pageNumber: Int = 0,
    val totalPages: Int = 0,
    val totalResults: Int = 0,
    val resultsPerPage: Int = 0,
    val sortState: SortState = SortState("notabilityIndex", Sort.Direction.DESC)
)
