package com.vsharkovski.dbpaperapi.model

// Spring Data JPA projection to enable more efficient mass-database modifications

interface PersonIdAndNames {
    val id: Long
    val name: String?
    val nameProcessed: String?
}