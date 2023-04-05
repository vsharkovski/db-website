package com.vsharkovski.dbpaperapi.service

import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVParser
import org.apache.commons.csv.CSVRecord
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.io.File

@Service
class ImportService(val importRecordAdder: ImportRecordAdder) {
    val logger: Logger = LoggerFactory.getLogger(ImportService::class.java)

    @Value("\${db-management.log.update-interval}")
    private val logStatusUpdateInterval = 100000

    fun importAll(file: File) {
        // Import all records of the file.
        logger.info("Import all: starting [{}]", file.path)
        file.forEachCSVRecordBuffered(
            importRecordAdder::addPerson,
            createLogStatusUpdateFunction("Import all")
        )
        logger.info("Import all: ended [{}]", file.path)
    }

    private fun createLogStatusUpdateFunction(taskName: String): (Int) -> Unit {
        return { index ->
            if (index % logStatusUpdateInterval == 0)
                logger.info("$taskName: $index processed")
        }
    }
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