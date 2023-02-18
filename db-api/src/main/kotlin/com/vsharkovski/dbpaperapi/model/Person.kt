package com.vsharkovski.dbpaperapi.model

import javax.persistence.*

@Entity
@Table(name = "people")
data class Person(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    val wikidataCode: Int?,

    val birth: Short?,

    val death: Short?,

    val name: String?,

    val nameProcessed: String?,

    val genderId: Short?,

    @Column(name = "level_1_main_occ_id")
    val level1MainOccId: Short?,

    @Column(name = "level_3_main_occ_id")
    val level3MainOccId: Short?,

    @Column(name = "citizenship_1_b_id")
    val citizenship1BId: Short?,

    @Column(name = "citizenship_2_b_id")
    val citizenship2BId: Short?,

    @Column(name = "birth_longitude")
    val birthLongitude: Float?,

    @Column(name = "birth_latitude")
    val birthLatitude: Float?,

    @Column(name = "death_longitude")
    val deathLongitude: Float?,

    @Column(name = "death_latitude")
    val deathLatitude: Float?,

    @Column(name = "notability_index")
    val notabilityIndex: Float?,
)
