package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVParser
import org.springframework.stereotype.Service
import java.io.File

@Service
class CSVService(
    val personRepository: PersonRepository
) {
    fun save(file: File) {
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
            val person = Person(
                wikidataCode = record.get("wikidata_code"),
                birth = record.get("birth").toIntOrNull(),
                death = record.get("death").toIntOrNull(),
                gender = record.get("gender").ifEmpty { null },
                name = record.get("name").ifEmpty { null },
                level1MainOcc = record.get("level1_main_occ").ifEmpty { null },
                level2MainOcc = record.get("level2_main_occ").ifEmpty { null },
                level2SecondOcc = record.get("level2_second_occ").ifEmpty { null },
                citizenship1B = record.get("citizenship_1_b").ifEmpty { null },
                citizenship2B = record.get("citizenship_2_b").ifEmpty { null },
                area1RAttachment = record.get("area1_of_rattachment").ifEmpty { null },
                area2RAttachment = record.get("area2_of_rattachment").ifEmpty { null },
                birthLongitude = record.get("bplo1").toFloatOrNull(),
                birthLatitude = record.get("bpla1").toFloatOrNull(),
                deathLongitude = record.get("dplo1").toFloatOrNull(),
                deathLatitude = record.get("dpla1").toFloatOrNull()
            )
            personRepository.save(person)
        }
    }
}
