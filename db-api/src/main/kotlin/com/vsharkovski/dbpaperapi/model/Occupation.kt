package com.vsharkovski.dbpaperapi.model

import javax.persistence.*

@Entity
@Table(name = "occupations")
data class Occupation(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Short = 0,

    val type: Short = 0,

    val name: String,
)
