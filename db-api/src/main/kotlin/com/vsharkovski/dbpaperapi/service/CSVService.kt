package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVParser
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.io.File

@Service
class CSVService(
    val personRepository: PersonRepository
) {
    private val logger = LoggerFactory.getLogger(CSVService::class.java)

    fun save(file: File) {
        val persons = csvToPersons(file)
    }

    private fun csvToPersons(file: File): List<Person> {
        val bufferedReader = file.bufferedReader()
        val csvParser = CSVParser(
            bufferedReader,
            CSVFormat.Builder
                .create()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build()
        )
        logger.info("About to parse file with path {}", file.path)
        for ((index, record) in csvParser.records.withIndex()) {
            if (index >= 100) {
                break
            }
            logger.info("Record #{} has birth {}", index, record.get("birth"))
        }
        return emptyList()
//        return csvParser.records.map {
//            Person(
//                wikidataCode = it.get("wikidata_code"),
//                birth = it.get("birth").,
//                death = it.get("death")
//            )
//        }
    }
}
