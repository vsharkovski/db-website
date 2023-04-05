package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.EExportJobStatus
import com.vsharkovski.dbpaperapi.model.ExportJob
import com.vsharkovski.dbpaperapi.repository.ExportJobRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.core.io.ResourceLoader
import org.springframework.core.io.support.ResourcePatternUtils
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import javax.annotation.PostConstruct
import javax.transaction.Transactional

@Service
class ExportJobProcessor(
    val resourceLoader: ResourceLoader,
    val searchService: SearchService,
    val tempDirectoryService: TempDirectoryService,
    val filesService: FilesService,
    val exportJobRepository: ExportJobRepository
) {
    val logger: Logger = LoggerFactory.getLogger(this::class.java)

    @Value("\${exporting.path}")
    val exportPath: String = ""

    @Value("\${exporting.csv.header}")
    val csvHeaderResource: Resource? = null

    lateinit var csvHeader: String

    @Value("\${exporting.included}")
    val includedFilesResourcesPath: String = ""

    lateinit var includedFilesPaths: List<Path>

    @PostConstruct
    fun init() {
        logger.info("Export path: [{}]", exportPath)

        getCSVHeader()
        getIncludedFilesPaths()
    }

    @Async
    @Transactional
    fun processJob(job: ExportJob) {
        val tempFilePath = Paths.get("${tempDirectoryService.tempDirectoryPath}/result.csv")
        val zipPath = Paths.get("${exportPath}/${job.fileName}.zip")

        try {
            // Create temp file: the result of the query.
            filesService.clearDirectory(tempDirectoryService.tempDirectoryPath)
            searchAndWriteToFile(job.searchTerm, tempFilePath)

            // Zip files to an archive in the exported folder.
            val filesToZip = listOf(includedFilesPaths, listOf(tempFilePath)).flatten()
            filesService.zipFiles(filesToZip, zipPath)

            // Update status to successfully processed.
            exportJobRepository.save(job.copy(status = EExportJobStatus.PROCESS_SUCCESS))
        } catch (e: Exception) {
            // Some other error, either with file writing or database.
            logger.error("Failed exporting job [{}]: [{}]", job, e.message, e)
            exportJobRepository.save(job.copy(status = EExportJobStatus.PROCESS_FAIL))

            // Delete zip file.
            Files.deleteIfExists(zipPath)
        } finally {
            // Delete temp file.
            Files.deleteIfExists(tempFilePath)
        }
    }

    @Transactional
    fun searchAndWriteToFile(searchTerm: String, filePath: Path) {
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

    private fun getCSVHeader() {
        csvHeader = if (!csvHeaderResource!!.exists()) {
            logger.error("CSV Header resource does not exist: [{}]", csvHeaderResource!!.url)
            ""
        } else {
            csvHeaderResource!!.inputStream.bufferedReader().readLines().firstOrNull() ?: ""
        }
        logger.info("CSV Header: [{}]", csvHeader)
    }

    private fun getIncludedFilesPaths() {
        // Get Resource objects from configuration.
        val includedFilesResources =
            ResourcePatternUtils
                .getResourcePatternResolver(resourceLoader)
                .getResources(includedFilesResourcesPath)
                .toList()

        includedFilesResources.forEach {
            if (!it.exists()) logger.error("Included file not found: [{}]", it)
        }

        // Copy files from classpath to another place in the filesystem.
        // This is necessary because we can't use Resource.getFile() in a .jar.
        val copiedDirectory = Paths.get("${exportPath}/prepared")
        filesService.clearDirectory(copiedDirectory)
        includedFilesPaths = filesService.copyResourcesToDirectory(
            includedFilesResources.filter { it.exists() },
            copiedDirectory
        )

        logger.info("Included files: {}", includedFilesPaths)
    }
}