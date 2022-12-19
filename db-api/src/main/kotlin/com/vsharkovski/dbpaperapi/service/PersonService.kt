package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class PersonService(
    val personRepository: PersonRepository,
    val nameService: NameService
) {
    private val logger: Logger = LoggerFactory.getLogger(PersonService::class.java)

    fun processPersonNamesForSearch() {

    }
}