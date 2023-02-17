package com.vsharkovski.dbpaperapi.api

import com.vsharkovski.dbpaperapi.model.Person

data class SearchResponse(
    val persons: List<Person>,
    val hasPreviousPage: Boolean,
    val hasNextPage: Boolean,
    val pageNumber: Int,
    val totalPages: Int,
    val totalResults: Int,
    val resultsPerPage: Int,
    val sort: PublicSortState
)