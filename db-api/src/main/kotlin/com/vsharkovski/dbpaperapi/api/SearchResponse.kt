package com.vsharkovski.dbpaperapi.api

import com.vsharkovski.dbpaperapi.model.Person

data class SearchResponse(
    val persons: List<Person>,
    val hasPreviousPage: Boolean,
    val hasNextPage: Boolean,
    val sort: PublicSortState
)