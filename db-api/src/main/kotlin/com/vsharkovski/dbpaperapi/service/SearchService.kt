package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.model.SearchOperation
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.springframework.stereotype.Service
import java.util.regex.Pattern

@Service
class SearchService(
    val personRepository: PersonRepository
) {
    fun findFirst10PeopleByTerm(term: String): List<Person> {
        val builder = PersonSpecificationBuilder()
        val pattern =
            Pattern.compile("(\\w+?)(${SearchOperation.SIMPLE_OPERATION_SET_JOINED})(\\p{Punct}?)(\\w+?)(\\p{Punct}?),")
        val matcher = pattern.matcher("$term,")
        while (matcher.find()) {
            builder.with(
                matcher.group(1),
                matcher.group(2),
                matcher.group(3),
                matcher.group(4),
                matcher.group(5)
            )
        }
        return builder.build()?.let { personRepository.findAll(it) } ?: emptyList()
    }
}