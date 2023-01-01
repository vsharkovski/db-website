package com.vsharkovski.dbpaperapi.model

data class UnprocessedSearchCriterion(
    val key: String,
    val operation: String,
    val value: String,
    val prefix: String,
    val suffix: String
)
