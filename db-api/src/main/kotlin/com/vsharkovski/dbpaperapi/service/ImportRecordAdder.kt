package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.apache.commons.csv.CSVRecord
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service

@Service
class ImportRecordAdder(
    val personRepository: PersonRepository,
    val genderService: GenderService,
    val occupationService: OccupationService,
    val citizenshipService: CitizenshipService,
    val nameService: NameService
) {
    @Async("importTaskExecutor")
    fun addPerson(record: CSVRecord, rawData: String) {
        val name = record.get("name").ifEmpty { null }
        val person = Person(
            rawData = rawData,
            wikidataCode = record.get("wikidata_code").substring(1).toIntOrNull(),
            birth = record.get("birth").toShortOrNull(),
            death = record.get("death").toShortOrNull(),
            name = name,
            nameProcessed = name?.let { nameService.processForSearch(it) },
            genderId = record.get("gender")
                .ifNotEmptyOrNull { genderService.findOrAddByName(it).id },
            level1MainOccId = record.get("level1_main_occ")
                .ifNotEmptyOrNull { occupationService.findOrAddByName(it, 1).id },
            level3MainOccId = record.get("level3_main_occ")
                .ifNotEmptyOrNull { occupationService.findOrAddByName(it, 3).id },
            citizenship1BId = record.get("citizenship_1_b")
                .ifNotEmptyOrNull { citizenshipService.findOrAddByName(it).id },
            citizenship2BId = record.get("citizenship_2_b")
                .ifNotEmptyOrNull { citizenshipService.findOrAddByName(it).id },
            birthLongitude = record.get("bplo1").toFloatOrNull(),
            birthLatitude = record.get("bpla1").toFloatOrNull(),
            deathLongitude = record.get("dplo1").toFloatOrNull(),
            deathLatitude = record.get("dpla1").toFloatOrNull(),
            notabilityIndex = record.get("sum_visib_ln_5criteria").toFloatOrNull()
        )
        personRepository.save(person)
    }
}