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

@Service
class ImportService(
    val personRepository: PersonRepository,
    val genderService: GenderService,
    val occupationService: OccupationService,
    val citizenshipService: CitizenshipService,
    val nameService: NameService
) {
    val logger: Logger = LoggerFactory.getLogger(ImportService::class.java)

    private val logStatusUpdateInterval = 100000

    fun importAll(file: File) {
        // Import all records of the file.
        logger.info("Import all: starting [{}]", file.path)
        file.forEachCSVRecordBuffered(
            this::addRecordToDB,
            createLogStatusUpdateFunction("Import all")
        )
        logger.info("Import all: ended [{}]", file.path)
    }

    private fun addRecordToDB(record: CSVRecord, rawData: String) {
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

    private fun createLogStatusUpdateFunction(taskName: String): (Int) -> Unit {
        return { index ->
            if (index % logStatusUpdateInterval == 0)
                logger.info("$taskName: $index processed")
        }
    }
}

fun <T> String.ifNotEmptyOrNull(predicate: (String) -> T): T? =
    if (this.isEmpty()) {
        null
    } else {
        predicate(this)
    }

fun File.forEachCSVRecordBuffered(predicate: (CSVRecord, String) -> Unit, logFunction: (Int) -> Unit) {
    // We use two buffered readers in parallel: one that reads the raw lines, and one that
    // reads the lines and creates a CSVRecord for each one.
    val rawBufferedReader = this.bufferedReader()
    rawBufferedReader.readLine()

    val csvBufferedReader = this.bufferedReader()
    val csvParser = CSVParser(
        csvBufferedReader,
        CSVFormat.Builder
            .create()
            .setSkipHeaderRecord(true)
            .setIgnoreHeaderCase(true)
            .setTrim(true)
            .setHeader()
            .build()
    )

    // Read each record.
    var index = 0

    for (record in csvParser) {
        val line = rawBufferedReader.readLine()
        predicate(record, line)

        index++
        logFunction(index)
    }

    logFunction(index)
}