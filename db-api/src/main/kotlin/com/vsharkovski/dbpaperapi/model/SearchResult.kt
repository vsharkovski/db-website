package com.vsharkovski.dbpaperapi.model

import org.springframework.data.domain.Sort

data class SearchResult<T>(
    val results: List<T> = emptyList(),
    val hasPreviousPage: Boolean = false,
    val hasNextPage: Boolean = false,
    val sortState: SortState = SortState("notabilityRank", Sort.Direction.ASC)
)
