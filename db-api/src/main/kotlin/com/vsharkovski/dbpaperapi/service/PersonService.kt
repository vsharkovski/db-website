package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.PersonIdAndNames
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service

@Service
class PersonService(
    val personRepository: PersonRepository,
    val nameService: NameService
) {
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @Value("\${search.results-per-page}")
    val batchSize: Int = 1000

    fun processAllPersonNamesForSearch() {
        logger.info("Person names processing for search: starting")
        var slice = personRepository.findBy(PageRequest.of(0, batchSize))
        slice.content.forEach { processSinglePersonNameForSearch(it) }
        var processedEntries = slice.content.size
        while (slice.hasNext()) {
            slice = personRepository.findBy(slice.nextPageable())
            slice.content.forEach { processSinglePersonNameForSearch(it) }
            processedEntries += slice.content.size
            if (processedEntries % 100000 == 0) {
                logger.info("Person names processing for search: {} entries processed so far", processedEntries)
            }
        }
        logger.info("Person names processing for search: finished, total {} entries processed", processedEntries)
    }

    fun processSinglePersonNameForSearch(person: PersonIdAndNames) =
        person.name?.let {
            personRepository.setNameProcessed(person.id, nameService.processForSearch(it))
        }

}
