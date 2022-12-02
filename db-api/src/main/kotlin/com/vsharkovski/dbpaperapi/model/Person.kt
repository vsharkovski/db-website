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

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "gender_id")
//    val gender: Gender?,
    val genderId: Int?,

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "level_1_main_occ_id")
//    val level1MainOcc: Occupation?,

    @Column(name = "level_1_main_occ_id")
    val level1MainOccId: Int?,

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "level_2_main_occ_id")
//    val level2MainOcc: Occupation?,

    @Column(name = "level_2_main_occ_id")
    val level2MainOccId: Int?,

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "level_2_second_occ_id")
//    val level2SecondOcc: Occupation?,

    @Column(name = "level_2_second_occ_id")
    val level2SecondOccId: Int?,

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "citizenship_1_b_id")
//    val citizenship1B: Citizenship?,

    @Column(name = "citizenship_1_b_id")
    val citizenship1BId: Int?,

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "citizenship_2_b_id")
//    val citizenship2B: Citizenship?,

    @Column(name = "citizenship_2_b_id")
    val citizenship2BId: Int?,

    @Column(name = "birth_longitude")
    val birthLongitude: Float?,

    @Column(name = "birth_latitude")
    val birthLatitude: Float?,

    @Column(name = "death_longitude")
    val deathLongitude: Float?,

    @Column(name = "death_latitude")
    val deathLatitude: Float?,

    @Column(name = "wiki_reader_count")
    val wikiReaderCount: Long?
)
