package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.springframework.stereotype.Service

@Service
class SearchService(
    val personRepository: PersonRepository
) {

}