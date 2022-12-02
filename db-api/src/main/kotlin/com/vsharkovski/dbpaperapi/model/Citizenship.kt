package com.vsharkovski.dbpaperapi.model

import javax.persistence.*

@Entity
@Table(name = "citizenships")
data class Citizenship(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int = 0,

    val name: String,

    val nameProcessed: String,

    val nameReadable: String?,
)
