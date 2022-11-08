package com.vsharkovski.dbpaperapi.api

import com.vsharkovski.dbpaperapi.service.SearchService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/search")
class SearchController(
    val searchService: SearchService
) {
    @GetMapping
    fun findAllBySpecification(@RequestParam term: String): ResponseEntity<SearchResponse> =
        ResponseEntity.ok(
            SearchResponse(
                searchService.findFirst10PeopleByTerm(term)
            )
        )
}