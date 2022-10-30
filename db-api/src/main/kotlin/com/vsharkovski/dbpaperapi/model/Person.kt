package com.vsharkovski.dbpaperapi.model

import javax.persistence.*

@Entity
@Table(name = "people")
data class Person(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "wikidata_code")
    val wikidataCode: String?,

    val birth: Int?,

    val death: Int?,

    val gender: String?,

    val name: String?,

    @Column(name = "level_1_main_occ")
    val level1MainOcc: String?,

    @Column(name = "level_2_main_occ")
    val level2MainOcc: String?,

    @Column(name = "level_2_second_occ")
    val level2SecondOcc: String?,

    @Column(name = "citizenship_1_b")
    val citizenship1B: String?,

    @Column(name = "citizenship_2_b")
    val citizenship2B: String?,

    @Column(name = "area_1_r_attachment")
    val area1RAttachment: String?,

    @Column(name = "area_2_r_attachment")
    val area2RAttachment: String?,

    @Column(name = "birth_longitude")
    val birthLongitude: Float?,

    @Column(name = "birth_latitude")
    val birthLatitude: Float?,

    @Column(name = "death_longitude")
    val deathLongitude: Float?,

    @Column(name = "death_latitude")
    val deathLatitude: Float?
)
