package com.vsharkovski.dbpaperapi.model

import javax.persistence.*

@Entity
@Table(name = "people")
data class Person(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    val wikidataCode: String?,

    val birth: Int?,

    val death: Int?,

    val gender: String?,

    val name: String?,

    val level1MainOcc: String?,

    val level2MainOcc: String?,

    val level2SecondOcc: String?,

    val citizenship1B: String?,

    val citizenship2B: String?,

    val area1OfRAttachment: String?,

    val area2OfRAttachment: String?,

    val bplo1: Double?,

    val bpla1: Double?,

    val dplo1: Double?,

    val dpla1: Double?
)
