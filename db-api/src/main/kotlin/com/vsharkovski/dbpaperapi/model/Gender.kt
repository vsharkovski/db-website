package com.vsharkovski.dbpaperapi.model

import javax.persistence.*

@Entity
@Table(name = "genders")
data class Gender(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int = 0,

    val name: String,
)
