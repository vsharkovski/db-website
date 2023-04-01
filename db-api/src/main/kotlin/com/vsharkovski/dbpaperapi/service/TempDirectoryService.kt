package com.vsharkovski.dbpaperapi.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.util.FileSystemUtils
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import javax.annotation.PostConstruct
import kotlin.io.path.exists

@Service
class TempDirectoryService {
    @Value("\${temp.path}")
    val tempDirectoryPathString = ""

    lateinit var tempDirectoryPath: Path

    @PostConstruct
    fun init() {
        // Create the directory if missing.
        tempDirectoryPath = Paths.get(tempDirectoryPathString)
        Files.createDirectories(tempDirectoryPath)

        // Clear it.
        clearDirectory(tempDirectoryPath)
    }

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
}