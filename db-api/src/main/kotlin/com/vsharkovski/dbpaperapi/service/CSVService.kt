package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVParser
import org.apache.commons.csv.CSVRecord
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.io.File

fun <T> String.ifNotEmptyOrNull(predicate: (String) -> T): T? =
    if (this.isEmpty()) {
        null
    } else {
        predicate(this)
    }

@Service
class CSVService(
    val personRepository: PersonRepository,
    val genderService: GenderService,
    val occupationService: OccupationService,
    val citizenshipService: CitizenshipService,
    val nameService: NameService
) {
    val logger: Logger = LoggerFactory.getLogger(CSVService::class.java)

    fun saveFile(file: File) {
        logger.info("Starting to save file [{}]", file.path)
        val bufferedReader = file.bufferedReader()
        val csvParser = CSVParser(
            bufferedReader,
            CSVFormat.Builder
                .create()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .setHeader()
                .build()
        )
        for (record in csvParser) {
            saveRecord(record)
        }
        logger.info("Finished saving file [{}]", file.path)
    }

    private fun saveRecord(record: CSVRecord) {
        val name = record.get("name").ifEmpty { null }
        val person = Person(
            wikidataCode = record.get("wikidata_code").substring(1).toInt(),
            birth = record.get("birth").toShortOrNull(),
            death = record.get("death").toShortOrNull(),
            name = name,
            nameProcessed = name?.let { nameService.processForSearch(it) },
            genderId = record.get("gender")
                .ifNotEmptyOrNull { genderService.findOrAddByName(it).id },
            level1MainOccId = record.get("level1_main_occ")
                .ifNotEmptyOrNull { occupationService.findOrAddByName(it).id },
            level2MainOccId = record.get("level2_main_occ")
                .ifNotEmptyOrNull { occupationService.findOrAddByName(it).id },
            level2SecondOccId = record.get("level2_second_occ")
                .ifNotEmptyOrNull { occupationService.findOrAddByName(it).id },
            citizenship1BId = record.get("citizenship_1_b")
                .ifNotEmptyOrNull { citizenshipService.findOrAddByName(it).id },
            citizenship2BId = record.get("citizenship_2_b")
                .ifNotEmptyOrNull { citizenshipService.findOrAddByName(it).id },
            birthLongitude = record.get("bplo1").toFloatOrNull(),
            birthLatitude = record.get("bpla1").toFloatOrNull(),
            deathLongitude = record.get("dplo1").toFloatOrNull(),
            deathLatitude = record.get("dpla1").toFloatOrNull()
        )
//        logger.info("Saving person [{}]", person)
        personRepository.save(person)
    }

}
