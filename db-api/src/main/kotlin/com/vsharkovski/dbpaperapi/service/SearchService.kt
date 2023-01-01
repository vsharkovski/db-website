package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.model.SearchOperation
import com.vsharkovski.dbpaperapi.model.SearchResult
import com.vsharkovski.dbpaperapi.model.SortState
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.domain.Specification
import org.springframework.stereotype.Service
import java.util.regex.Pattern

@Service
class SearchService(
    val personRepository: PersonRepository,
    val personSpecificationBuilderService: PersonSpecificationBuilderService
) {
    val logger: Logger = LoggerFactory.getLogger(SearchService::class.java)

    @Value("\${search.results-per-page}")
    val resultsPerPage: Int = 1000

    val forbiddenCharacters = ",${SearchOperation.SIMPLE_OPERATION_SET.joinToString("")}"

    val sortableNullableVariables = listOf("birth", "death")

    fun findPeopleBySearchTerm(
        term: String,
        pageNumber: Int,
        sortState: SortState,
    ): SearchResult<Person> {
        if (pageNumber < 0) {
            return SearchResult()
        }
        val builder = personSpecificationBuilderService.createBuilder()

        // Note: If the string has forbidden characters, the pattern matcher will either
        // not match it or match it incorrectly. Either case is good.
        val pattern =
            Pattern.compile("(\\w+?)(${SearchOperation.SIMPLE_OPERATION_SET_JOINED_OR})(\\p{Punct}?)([^$forbiddenCharacters]+?)(\\p{Punct}?),")
        val matcher = pattern.matcher("$term,")
        while (matcher.find()) {
            personSpecificationBuilderService.with(
                builder,
                matcher.group(1),
                matcher.group(2),
                matcher.group(4),
                matcher.group(3),
                matcher.group(5)
            )
        }

        return personSpecificationBuilderService.build(builder)?.let { builtSpecification ->
            val specification = if (sortState.variable in sortableNullableVariables) {
                addNonNullSpecificationForVariable(builtSpecification, sortState.variable)
            } else {
                builtSpecification
            }

            val paging = PageRequest.of(
                pageNumber, resultsPerPage,
                Sort.by(sortState.direction, sortState.variable)
            )

            val resultsSlice = personRepository.findAll(specification, paging)

            return SearchResult(
                results = resultsSlice.content,
                hasPreviousPage = resultsSlice.hasPrevious(),
                hasNextPage = resultsSlice.hasNext(),
                pageNumber = pageNumber,
                maxSliceSize = resultsPerPage,
                sortState = sortState
            )
        } ?: SearchResult()
    }

    private fun addNonNullSpecificationForVariable(
        specification: Specification<Person>,
        variable: String
    ): Specification<Person> =
        Specification.where(specification).and { root, _, builder ->
            builder.isNotNull(root.get<Any>(variable))
        }
}
