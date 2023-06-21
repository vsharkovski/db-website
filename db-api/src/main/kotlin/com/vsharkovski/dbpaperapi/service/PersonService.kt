package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.model.PersonIdAndNames
import com.vsharkovski.dbpaperapi.model.PersonNoRawData
import com.vsharkovski.dbpaperapi.model.TimelinePoint
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service

@Service
class PersonService(val personRepository: PersonRepository) {
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @Value("\${timeline.result-limit}")
    val defaultResultLimit: Int = 50000

    /**
     * The result limit is intended to keep response sizes low (below 5 MB).
     */
    fun getTimelineData(resultLimit: Int? = null, birthYearRange: Pair<Short, Short>? = null): List<TimelinePoint> {
        if (resultLimit != null && resultLimit < 1) {
            return listOf()
        }
        val pageRequest = PageRequest.of(0, resultLimit?.coerceAtMost(defaultResultLimit) ?: defaultResultLimit)
        val results = if (birthYearRange == null) {
            personRepository.findTimelineData(pageRequest)
        } else {
            personRepository.findTimelineDataByBirthYearRange(pageRequest, birthYearRange.first, birthYearRange.second)
        }
        return results.content.map {
            TimelinePoint(
                wikidataCode = it.wikidataCode!!,
                time = it.birth!!,
                notabilityIndex = it.notabilityIndex!!,
                genderId = it.genderId,
                level1MainOccId = it.level1MainOccId,
                citizenship1BId = it.citizenship1BId
            )
        }
    }


    fun findPeopleByWikidataCodes(codes: List<Int>): List<PersonNoRawData> =
        codes.mapNotNull { this.personRepository.findByWikidataCode(it) }
}
