package com.vsharkovski.dbpaperapi.service

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.core.io.Resource
import org.springframework.stereotype.Service
import org.springframework.util.FileSystemUtils
import java.nio.file.Files
import java.nio.file.Path
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import kotlin.io.path.exists

@Service
class FilesService {
    val logger: Logger = LoggerFactory.getLogger(this::class.java)

    fun clearDirectory(directory: Path) {
        if (!directory.exists()) {
            return
        }

        // Delete all subdirectories and files.
        Files.newDirectoryStream(directory).use { children ->
            children.forEach {
                FileSystemUtils.deleteRecursively(it)
            }
        }
    }

    fun zipFiles(files: List<Path>, outputPath: Path) {
        Files.createDirectories(outputPath.parent)
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
                            zipOutput.write(bytes, 0, length)
                        }
                    }
                }
            }
        }
    }

    fun copyResourcesToDirectory(resources: List<Resource>, directory: Path): List<Path> {
        Files.createDirectories(directory)

        val outputPaths = mutableListOf<Path>()
        resources.forEach {
            val outputPath = directory.resolve(it.filename!!)
            try {
                Files.copy(it.inputStream, outputPath)
                outputPaths.add(outputPath)
            } catch (e: Exception) {
                logger.error("Error copying resource to directory [{}, {}]: [{}]", it.filename, directory, e.message, e)
            }
        }

        return outputPaths
    }

}