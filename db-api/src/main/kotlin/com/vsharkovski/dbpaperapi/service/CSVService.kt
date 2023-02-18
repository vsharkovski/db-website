package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.model.RawCSVData
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import com.vsharkovski.dbpaperapi.repository.RawCSVDataRepository
import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVParser
import org.apache.commons.csv.CSVRecord
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.io.File

@Service
class CSVService(
    val personRepository: PersonRepository,
    val rawCSVDataRepository: RawCSVDataRepository,
    val genderService: GenderService,
    val occupationService: OccupationService,
    val citizenshipService: CitizenshipService,
    val nameService: NameService
) {
    val logger: Logger = LoggerFactory.getLogger(CSVService::class.java)

    private val logStatusUpdateInterval = 100000

    fun addFileRelational(file: File) {
        // Add all records of the file into the relational tables.
        logger.info("Add file relational: starting [{}]", file.path)
        file.forEachCSVRecordBuffered(
            this::addRecordToRelationalDB,
            createLogStatusUpdateFunction("Add file relational")
        )
        logger.info("Add file relational: ended [{}]", file.path)
    }

    fun addFileRaw(file: File) {
        // Add all lines of the file into the raw table.
        logger.info("Add file raw: starting [{}]", file.path)

        val logFunction = createLogStatusUpdateFunction("Add file raw")
        var index = 0
        file.forEachLine { line ->
            if (index > 0) {
                // Skip the first line as it is the header of the csv.
                addLineToRawDB(line)
            }

            index++
            logFunction(index)
        }

        logger.info("Add file relational: ended [{}]", file.path)
    }

    private fun addRecordToRelationalDB(record: CSVRecord) {
        val name = record.get("name").ifEmpty { null }
        val person = Person(
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

    private fun addLineToRawDB(line: String) {
        // Extract wikidata code from the line. It should be the first column.
        val firstCommaPosition = line.indexOf(',')
        val wikidataCode = line.substring(1, firstCommaPosition).toIntOrNull() ?: return

        // Get relational ID from the wikidata ID.
        val id = personRepository.findIdByWikidataCode(wikidataCode) ?: return

        // Save the record using the new ID.
        rawCSVDataRepository.save(RawCSVData(personId = id, data = line))
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

fun File.forEachCSVRecordBuffered(predicate: (CSVRecord) -> Unit, logFunction: (Int) -> Unit) {
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