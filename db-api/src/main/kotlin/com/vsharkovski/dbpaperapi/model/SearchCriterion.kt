package com.vsharkovski.dbpaperapi.model

data class SearchCriterion(
    val key: String,
    val operation: SearchOperation,
    val value: String,
)
