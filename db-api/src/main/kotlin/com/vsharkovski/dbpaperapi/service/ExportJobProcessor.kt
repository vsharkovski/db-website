package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.EExportJobStatus
import com.vsharkovski.dbpaperapi.model.ExportJob
import com.vsharkovski.dbpaperapi.repository.ExportJobRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import javax.annotation.PostConstruct
import javax.transaction.Transactional

@Service
class ExportJobProcessor(
    val searchService: SearchService,
    val tempDirectoryService: TempDirectoryService,
    val exportJobRepository: ExportJobRepository
) {
    val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @Value("\${exporting.path}")
    val exportPath: String = ""

    @Value("\${exporting.csv.header}")
    val csvHeaderResource: Resource? = null

    lateinit var csvHeader: String

    @Value("\${exporting.included}")
    val includedFilesResources: List<Resource> = listOf()

    lateinit var includedFilesPaths: List<Path>

    @PostConstruct
    fun init() {
        // Read the CSV header from the file.
        csvHeader = if (!csvHeaderResource!!.exists()) {
            logger.error("CSV Header resource does not exist: [{}]", csvHeaderResource!!.url)
            ""
        } else {
            csvHeaderResource!!.file.readLines().firstOrNull() ?: ""
        }
        logger.info("CSV Header: [{}]", csvHeader)

        // Create paths for included files.
//        val includedFilesResources = includedFilesResourcePaths.map { UrlResource(it) }
        includedFilesResources.forEach {
            if (!it.exists()) logger.error("Included file not found: [{}]", it)
        }
        includedFilesPaths = includedFilesResources.filter { it.exists() }.map { it.file.toPath() }
    }

    @Async
    @Transactional
    fun processJob(job: ExportJob) {
        try {
            // Create temp file: the result of the query.
            tempDirectoryService.clearDirectory()
            val tempFilePath = Paths.get("${tempDirectoryService.tempDirectoryPath}/result.csv")
            searchAndWriteToFile(job.searchTerm, tempFilePath)

            // Zip files to an archive in the exported folder.
            val filesToZip = listOf(includedFilesPaths, listOf(tempFilePath)).flatten()
            val zipOutput = Paths.get("${exportPath}/${job.fileName}.zip")
            zipFiles(filesToZip, zipOutput)

            // Update status to PROCESSED.
            exportJobRepository.save(job.copy(status = EExportJobStatus.PROCESS_SUCCESS))
        } catch (e: Exception) {
            // Some other error, either with file writing or database.
            logger.error("Failed exporting job [{}]: [{}]", job, e.message, e)
            exportJobRepository.save(job.copy(status = EExportJobStatus.PROCESS_FAIL))
        }
    }

    private fun searchAndWriteToFile(searchTerm: String, filePath: Path) {
        Files.createDirectories(filePath.parent)
        Files.newBufferedWriter(filePath).use { writer ->
            val stream = searchService.streamPeopleBySearchTerm(searchTerm)

            // Write header on first line.
            writer.write(csvHeader)
            writer.newLine()

            // Write all results.
            stream?.use {
                stream.forEach {
                    writer.write(it.rawData)
                    writer.newLine()
                }
            }
        }
    }

    private fun zipFiles(files: List<Path>, outputPath: Path) {
        Files.newOutputStream(outputPath).use { fileOutput ->
            ZipOutputStream(fileOutput).use { zipOutput ->
                for (filePath in files) {
                    // Add entry to zip archive.
                    val zipEntry = ZipEntry(filePath.fileName.toString())
                    zipOutput.putNextEntry(zipEntry)

                    // Add bytes of file to zip archive.
                    Files.newInputStream(filePath).use { fileInput ->
                        val bytes = ByteArray(1024)
                        while (true) {
                            val length = fileInput.read(bytes)
                            if (length < 0) break
                            zipOutput.write(bytes)
                        }
                    }
                }
            }
        }
    }
}