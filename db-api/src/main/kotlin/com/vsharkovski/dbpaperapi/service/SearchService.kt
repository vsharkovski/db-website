package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.model.SearchOperation
import com.vsharkovski.dbpaperapi.model.SearchResult
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import java.util.regex.Pattern

@Service
class SearchService(
    val personRepository: PersonRepository
) {
    val logger: Logger = LoggerFactory.getLogger(SearchService::class.java)

    fun findPeopleBySearchTerm(term: String, pageNumber: Int): SearchResult<Person> {
        if (pageNumber < 0) {
            return SearchResult()
        }
        val builder = PersonSpecificationBuilder()
        val pattern =
            Pattern.compile("(\\w+?)(${SearchOperation.SIMPLE_OPERATION_SET_JOINED})(\\p{Punct}?)(\\w+?)(\\p{Punct}?),")
        val matcher = pattern.matcher("$term,")
        while (matcher.find()) {
            builder.with(
                matcher.group(1),
                matcher.group(2),
                matcher.group(4),
                matcher.group(3),
                matcher.group(5)
            )
        }
        return builder.build()?.let {
            val paging = PageRequest.of(pageNumber, 1000, Sort.by("id"))
            val resultsSlice = personRepository.findAll(it, paging)
            return SearchResult(
                results = resultsSlice.content,
                hasPreviousPage = resultsSlice.hasPrevious(),
                hasNextPage = resultsSlice.hasNext()
            )
        } ?: SearchResult()
    }
}