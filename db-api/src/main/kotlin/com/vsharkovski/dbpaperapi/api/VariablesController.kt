package com.vsharkovski.dbpaperapi.api

import com.vsharkovski.dbpaperapi.service.CitizenshipService
import com.vsharkovski.dbpaperapi.service.GenderService
import com.vsharkovski.dbpaperapi.service.OccupationService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import javax.annotation.PostConstruct

@RestController
@RequestMapping("/api/variables")
class VariablesController(
    val genderService: GenderService,
    val occupationService: OccupationService,
    val citizenshipService: CitizenshipService
) {
    lateinit var allVariablesResponse: VariablesAllResponse

    @PostConstruct
    fun init() {
        // NOTE: If doing things in the StartupEventListener, this function will fire off before those.
        allVariablesResponse = VariablesAllResponse(
            genders = genderService.findAll().map { PublicVariable(id = it.id, name = it.name) },
            occupations = occupationService.findAll().map { PublicVariable(id = it.id, name = it.name) },
            citizenships = citizenshipService.findAll().map { PublicVariable(id = it.id, name = it.nameReadable ?: it.name) }
        )
    }

    @GetMapping(value = ["", "/"])
    fun getAll(): ResponseEntity<VariablesAllResponse> =
        ResponseEntity.ok(allVariablesResponse)
}