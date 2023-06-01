package com.vsharkovski.dbpaperapi.api

data class SearchResponse<T>(
    val results: List<T>,
    val hasPreviousPage: Boolean,
    val hasNextPage: Boolean,
    val pageNumber: Int,
    val totalPages: Int,
    val totalResults: Int,
    val resultsPerPage: Int,
    val sort: PublicSortState
)