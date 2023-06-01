package com.vsharkovski.dbpaperapi.model

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty

/**
 * Minimal data for a person to be displayed in the timeline.
 * Class intended to be returned in the timeline requests, with its response taking minimal space.
 */

@JsonInclude(JsonInclude.Include.NON_NULL)
data class TimelinePoint(
    @get:JsonProperty("wC")
    val wikidataCode: Int,

    @get:JsonProperty("t")
    val time: Short,

    @get:JsonProperty("n")
    val notabilityIndex: Float,

    @get:JsonProperty("g")
    val genderId: Short?,

    @get:JsonProperty("l1o")
    val level1MainOccId: Short?,

    @get:JsonProperty("c1b")
    val citizenship1BId: Short?
)
