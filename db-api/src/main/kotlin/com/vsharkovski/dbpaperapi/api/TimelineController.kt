package com.vsharkovski.dbpaperapi.api

import com.vsharkovski.dbpaperapi.service.PersonService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/timeline")
class TimelineController(val personService: PersonService) {
    @GetMapping
    fun getTimelineData(): ResponseEntity<TimelineResponse> {
        val result = personService.getTimelineData(26.0f)
        return ResponseEntity.ok(TimelineResponse(results = result))
    }
}