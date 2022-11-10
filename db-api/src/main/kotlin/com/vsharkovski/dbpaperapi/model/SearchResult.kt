package com.vsharkovski.dbpaperapi.model

data class SearchResult<T>(
    val results: List<T> = emptyList(),
    val hasPreviousPage: Boolean = false,
    val hasNextPage: Boolean = false
)
