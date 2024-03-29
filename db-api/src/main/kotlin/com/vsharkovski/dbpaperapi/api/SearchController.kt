package com.vsharkovski.dbpaperapi.api

import com.vsharkovski.dbpaperapi.model.PersonNoRawData
import com.vsharkovski.dbpaperapi.model.SortState
import com.vsharkovski.dbpaperapi.service.SearchService
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/search")
class SearchController(val searchService: SearchService) {
    private final val sortDirectionStringToEnum: Map<String, Sort.Direction> =
        mapOf("ascending" to Sort.Direction.ASC, "descending" to Sort.Direction.DESC)

    private final val sortDirectionEnumToString: Map<Sort.Direction, String> =
        sortDirectionStringToEnum.entries.associate { it.value to it.key }

    @GetMapping
    fun findPeopleBySpecification(
        @RequestParam term: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "notabilityIndex") sortVariable: String,
        @RequestParam(defaultValue = "descending") sortDirection: String,
    ): ResponseEntity<SearchResponse<PersonNoRawData>> {
        val result = searchService.findPeopleBySearchTerm(
            term,
            page,
            SortState(
                variable = sortVariable,
                direction = sortDirectionStringToEnum[sortDirection] ?: Sort.Direction.DESC
            )
        )
        return ResponseEntity.ok(
            SearchResponse(
                results = result.results,
                hasPreviousPage = result.hasPreviousPage,
                hasNextPage = result.hasNextPage,
                pageNumber = page,
                totalPages = result.totalPages,
                totalResults = result.totalResults,
                resultsPerPage = result.resultsPerPage,
                sort = PublicSortState(
                    variable = result.sortState.variable,
                    direction = sortDirectionEnumToString[result.sortState.direction]!!
                )
            )
        )
    }
}