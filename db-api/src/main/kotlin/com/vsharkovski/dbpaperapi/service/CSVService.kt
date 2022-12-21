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

fun File.forEachCSVRecordBuffered(predicate: (CSVRecord) -> Unit) {
    val bufferedReader = this.bufferedReader()
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
        predicate(record)
    }
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

    fun addFile(file: File) {
        logger.info("Starting to save file [{}]", file.path)
        file.forEachCSVRecordBuffered { addRecord(it) }
        logger.info("Finished saving file [{}]", file.path)
    }

    fun addNotabilityIndices(file: File) {
        logger.info("Add notabilityIndex from file: starting [{}]", file.path)
        file.forEachCSVRecordBuffered { setRecordNotabilityIndex(it) }
        logger.info("Add notabilityIndex from file: finished [{}]", file.path)
    }

    private fun addRecord(record: CSVRecord) {
        val name = record.get("name").ifEmpty { null }
        val person = Person(
            wikidataCode = getRecordWikidataCode(record),
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
            deathLatitude = record.get("dpla1").toFloatOrNull(),
            notabilityIndex = getNotabilityIndex(record)
        )
//        logger.info("Saving person [{}]", person)
        personRepository.save(person)
    }

    private fun setRecordNotabilityIndex(record: CSVRecord) {
        val wikidataCode = getRecordWikidataCode(record) ?: return
        val notability = getNotabilityIndex(record) ?: return
        personRepository.setNotabilityIndex(wikidataCode, notability)
    }

    private fun getRecordWikidataCode(record: CSVRecord): Int? =
        record.get("wikidata_code").substring(1).toIntOrNull()

    private fun getNotabilityIndex(record: CSVRecord): Float? =
        record.get("sum_visib_ln_5criteria").toFloatOrNull()

}
