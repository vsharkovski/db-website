package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.*
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.domain.Specification
import org.springframework.stereotype.Service
import java.util.regex.Pattern
import java.util.stream.Stream

@Service
class SearchService(
    val personRepository: PersonRepository,
    val personSpecificationService: PersonSpecificationService
) {
    @Value("\${search.results-per-page}")
    val resultsPerPage: Int = 1000

    private final val criteriaPattern: Pattern

    init {
        val searchOperatorsJoinedOr = SearchOperation.SIMPLE_OPERATION_SET.joinToString("|")
        val forbiddenCharacters = ",${SearchOperation.SIMPLE_OPERATION_SET.joinToString("")}"

        criteriaPattern = Pattern.compile(
            """
            (\w+?)
            ($searchOperatorsJoinedOr)
            ([^$forbiddenCharacters]+?),
            """.trimIndent().replace("\n", "")
        )
    }

    fun findPeopleBySearchTerm(term: String, pageNumber: Int, sortState: SortState): SearchResult<PersonNoRawData> {
        // It is impossible to look for a page below 0.
        if (pageNumber < 0) {
            return SearchResult()
        }

        val specification = createSpecificationFromSearchTerm(term) ?: return SearchResult()

        // Create a paging object for the specified page and sort state.
        val paging = PageRequest.of(
            pageNumber, resultsPerPage,
            Sort.by(sortState.direction, sortState.variable)
        )

        // Query for results.
        val resultsPage = personRepository.findAll(specification, PersonNoRawData::class.java, paging)
        return SearchResult(
            results = resultsPage.content,
            hasPreviousPage = resultsPage.hasPrevious(),
            hasNextPage = resultsPage.hasNext(),
            pageNumber = pageNumber,
            totalPages = resultsPage.totalPages,
            totalResults = resultsPage.totalElements.toInt(),
            resultsPerPage = resultsPerPage,
            sortState = sortState
        )
    }

    fun streamPeopleBySearchTerm(term: String): Stream<PersonOnlyRawData>? =
        createSpecificationFromSearchTerm(term)?.let {
            personRepository.streamBy(it, PersonOnlyRawData::class.java)
        }


    private fun createSpecificationFromSearchTerm(term: String, sortState: SortState? = null): Specification<Person>? {
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
                    value = matcher.group(3),
                )
            )
        }

        // Create a specification from the found criteria.
        return personSpecificationService.createSpecification(criteria, sortState)
    }
}
