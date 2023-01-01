package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.*
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import java.util.regex.Pattern

@Service
class SearchService(
    val personRepository: PersonRepository,
    val personSpecificationService: PersonSpecificationService
) {
    private val logger: Logger = LoggerFactory.getLogger(SearchService::class.java)

    @Value("\${search.results-per-page}")
    val resultsPerPage: Int = 1000

    private final val forbiddenCharacters = ",${SearchOperation.SIMPLE_OPERATION_SET.joinToString("")}"
    val criteriaPattern: Pattern =
        Pattern.compile("(\\w+?)(${SearchOperation.SIMPLE_OPERATION_SET_JOINED_OR})(\\p{Punct}?)([^$forbiddenCharacters]+?)(\\p{Punct}?),")

    fun findPeopleBySearchTerm(
        term: String,
        pageNumber: Int,
        sortState: SortState,
    ): SearchResult<Person> {
        // It is impossible to look for a page below 0.
        if (pageNumber < 0) {
            return SearchResult()
        }

        // Pattern match individual search criterions in the term string.
        // Note: If the string has forbidden characters, the matcher will either
        // not match it or match it incorrectly. Either case is fine.
        val criteria = mutableListOf<UnprocessedSearchCriterion>()

        val matcher = criteriaPattern.matcher("$term,")
        while (matcher.find()) {
            criteria.add(
                UnprocessedSearchCriterion(
                    key = matcher.group(1),
                    operation = matcher.group(2),
                    value = matcher.group(4),
                    prefix = matcher.group(3),
                    suffix = matcher.group(5)
                )
            )
        }

        // Create a specification from the found criteria.
        val specification = personSpecificationService.createSpecification(criteria, sortState)
            ?: return SearchResult()

        // Create a paging object for the specified page and sort state.
        val paging = PageRequest.of(
            pageNumber, resultsPerPage,
            Sort.by(sortState.direction, sortState.variable)
        )

        // Query for results.
        val resultsSlice = personRepository.findAll(specification, paging)
        return SearchResult(
            results = resultsSlice.content,
            hasPreviousPage = resultsSlice.hasPrevious(),
            hasNextPage = resultsSlice.hasNext(),
            pageNumber = pageNumber,
            maxSliceSize = resultsPerPage,
            sortState = sortState
        )
    }
}
