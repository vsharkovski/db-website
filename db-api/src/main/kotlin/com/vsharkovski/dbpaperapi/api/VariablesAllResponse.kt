package com.vsharkovski.dbpaperapi.api

data class VariablesAllResponse(
    val genders: List<PublicVariable>,
    val occupations: List<PublicVariable>,
    val citizenships: List<PublicVariable>
)
