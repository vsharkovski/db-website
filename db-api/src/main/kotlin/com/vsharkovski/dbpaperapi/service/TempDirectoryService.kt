package com.vsharkovski.dbpaperapi.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.util.FileSystemUtils
import java.nio.file.Files
import java.nio.file.Paths
import javax.annotation.PostConstruct

@Service
class TempDirectoryService {
    @Value("\${temp.path}")
    val tempDirectoryPath = ""

    @PostConstruct
    fun init() {
        // Create the directory if missing.
        Files.createDirectories(Paths.get(tempDirectoryPath))

        // Clear it.
        clearDirectory()
    }

    fun clearDirectory() {
        // Delete all subdirectories and files.
        Files.newDirectoryStream(Paths.get(tempDirectoryPath)).use { children ->
            children.forEach {
                FileSystemUtils.deleteRecursively(it)
            }
        }
    }
}