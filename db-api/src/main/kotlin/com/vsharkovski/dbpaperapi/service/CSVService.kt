package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.repository.OccupationRepository
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

fun File.forEachCSVRecordBuffered(logFunction: (Int) -> Unit, predicate: (CSVRecord) -> Unit) {
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

    var index = 0
    for (record in csvParser) {
        predicate(record)

        index++
        logFunction(index)
    }
}

@Service
class CSVService(
    val personRepository: PersonRepository,
    val occupationRepository: OccupationRepository,
    val genderService: GenderService,
    val occupationService: OccupationService,
    val citizenshipService: CitizenshipService,
    val nameService: NameService
) {
    val logger: Logger = LoggerFactory.getLogger(CSVService::class.java)

    private val logStatusUpdateInterval = 100000

    fun addFile(file: File) {
        logger.info("Add file: starting [{}]", file.path)
        file.forEachCSVRecordBuffered(createLogStatusUpdateFunction("Add file")) {
            addRecord(it)
        }
        logger.info("Add file: ended [{}]", file.path)
    }

    fun addNotabilityIndices(file: File) {
        logger.info("Add notabilityIndex from file: starting [{}]", file.path)
        file.forEachCSVRecordBuffered(createLogStatusUpdateFunction("Add notabilityIndex")) {
            setRecordNotabilityIndex(it)
        }
        logger.info("Add notabilityIndex from file: finished [{}]", file.path)
    }

    fun addOccupations(file: File) {
        logger.info("Add occupations from file: starting [{}]", file.path)
        occupationRepository.setAllTypes(0)
        file.forEachCSVRecordBuffered(createLogStatusUpdateFunction("Add occupations")) {
            setRecordOccupations(it)
        }
        occupationService.deleteAllByType(0)
        logger.info("Add occupations from file: finished [{}]", file.path)
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
            notabilityIndex = getNotabilityIndex(record)
        )
        personRepository.save(person)
    }

    private fun setRecordNotabilityIndex(record: CSVRecord) {
        val wikidataCode = getRecordWikidataCode(record) ?: return
        val notability = getNotabilityIndex(record) ?: return
        personRepository.setNotabilityIndex(wikidataCode, notability)
    }

    private fun setRecordOccupations(record: CSVRecord) {
        val wikidataCode = getRecordWikidataCode(record) ?: return

        record.get("level1_main_occ").ifNotEmptyOrNull { occupationLevel1Name ->
            val id = occupationService.findOrAddByName(occupationLevel1Name, 1).id
            personRepository.setOccupationLevel1Id(wikidataCode, id)
        }

        record.get("level3_main_occ").ifNotEmptyOrNull { occupationLevel3Name ->
            val id = occupationService.findOrAddByName(occupationLevel3Name, 3).id
            personRepository.setOccupationLevel3Id(wikidataCode, id)
        }
    }

    private fun getRecordWikidataCode(record: CSVRecord): Int? =
        record.get("wikidata_code").substring(1).toIntOrNull()

    private fun getNotabilityIndex(record: CSVRecord): Float? =
        record.get("sum_visib_ln_5criteria").toFloatOrNull()

    private fun createLogStatusUpdateFunction(taskName: String): (Int) -> Unit {
        return { index ->
            if (index % logStatusUpdateInterval == 0)
                logger.info("$taskName: $index processed")
        }
    }
}
