package com.vsharkovski.dbpaperapi.api

data class PublicVariable(
    val id: Short,
    val name: String,
    val type: Short? = null
)
