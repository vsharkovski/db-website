package com.vsharkovski.dbpaperapi.api

import com.vsharkovski.dbpaperapi.service.PersonService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/timeline")
class TimelineController(val personService: PersonService) {
    @GetMapping
    fun getTimelineData(
        // Can't get request param validation to work, so handling it in the code.
        @RequestParam(required = false) limit: Int?,
        @RequestParam(required = false) minTime: Short?,
        @RequestParam(required = false) maxTime: Short?,
    ): ResponseEntity<TimelineResponse> {
        if (limit != null) {
            if (limit < 0) {
                return ResponseEntity.badRequest().body(TimelineResponse(results = emptyList()))
            } else if (limit == 0) {
                return ResponseEntity.ok(TimelineResponse(results = emptyList()))
            }
        }
        val birthYearLimit =
            if (minTime != null && maxTime != null) minTime to maxTime else null
        val result = personService.getTimelineData(limit, birthYearLimit)
        return ResponseEntity.ok(TimelineResponse(results = result))
    }
}