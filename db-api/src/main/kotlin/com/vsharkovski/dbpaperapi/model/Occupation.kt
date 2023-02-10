package com.vsharkovski.dbpaperapi.model

import javax.persistence.*

@Entity
@Table(name = "occupations")
data class Occupation(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int = 0,

    val type: Int = 0,

    val name: String,
)
