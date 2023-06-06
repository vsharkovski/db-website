package com.vsharkovski.dbpaperapi.api

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.model.PersonNoRawData
import com.vsharkovski.dbpaperapi.service.PersonService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/person")
class PersonController(val personService: PersonService) {
    @Value("\${wikidata-codes.max-persons}")
    val maxPersons: Int = 100

    @GetMapping("/wikidata_codes")
    fun findPeopleByWikidataCodes(@RequestParam(name = "codes") codesString: String): ResponseEntity<List<PersonNoRawData>> {
        val codes = codesString.split(",").mapNotNull { it.toIntOrNull() }.take(maxPersons)
        val result = this.personService.findPeopleByWikidataCodes(codes)
        return ResponseEntity.ok(result)
    }
}