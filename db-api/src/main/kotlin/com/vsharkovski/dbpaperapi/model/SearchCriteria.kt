package com.vsharkovski.dbpaperapi.model

data class SearchCriteria(
    val key: String,
    val operation: SearchOperation,
    val value: Any,
//    val orPredicate: Boolean
)
