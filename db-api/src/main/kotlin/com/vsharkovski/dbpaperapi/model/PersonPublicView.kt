package com.vsharkovski.dbpaperapi.model

interface PersonPublicView {
    val id: Long
    val wikidataCode: Int?
    val birth: Short?
    val death: Short?
    val name: String?
    val genderId: Short?
    val level1MainOccId: Short?
    val level3MainOccId: Short?
    val citizenship1BId: Short?
    val citizenship2BId: Short?
    val notabilityIndex: Float?
}
