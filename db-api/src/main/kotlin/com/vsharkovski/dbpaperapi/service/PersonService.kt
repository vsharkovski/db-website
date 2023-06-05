package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.PersonIdAndNames
import com.vsharkovski.dbpaperapi.model.TimelinePoint
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service

@Service
class PersonService(
    val personRepository: PersonRepository, val nameService: NameService
) {
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @Value("\${timeline.result-limit}")
    val resultLimit: Int = 50000

    /**
     * The result limit is intended to keep response sizes low (below 5 MB).
     */
    fun getTimelineData(): List<TimelinePoint> =
        personRepository.findTimelineData(PageRequest.of(0, resultLimit)).content.map {
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
