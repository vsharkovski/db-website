package com.vsharkovski.dbpaperapi.model

import javax.persistence.*

@Entity
@Table(name = "raw_csv_data")
data class RawCSVData(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "person_id")
    val personId: Long = 0,

    @Column(name = "data")
    val data: String = ""
)
