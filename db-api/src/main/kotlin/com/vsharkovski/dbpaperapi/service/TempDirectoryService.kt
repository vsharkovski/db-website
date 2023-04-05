package com.vsharkovski.dbpaperapi.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import javax.annotation.PostConstruct

@Service
class TempDirectoryService(val filesService: FilesService) {
    @Value("\${temp.path}")
    val tempDirectoryPathString = ""

    lateinit var tempDirectoryPath: Path

    @PostConstruct
    fun init() {
        // Create the directory if missing.
        tempDirectoryPath = Paths.get(tempDirectoryPathString)
        Files.createDirectories(tempDirectoryPath)

        // Clear it.
        filesService.clearDirectory(tempDirectoryPath)
    }
}