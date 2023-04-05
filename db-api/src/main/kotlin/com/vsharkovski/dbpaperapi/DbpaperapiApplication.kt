package com.vsharkovski.dbpaperapi

import com.vsharkovski.dbpaperapi.repository.custom.JpaSpecificationStreamExecutorWithProjectionImpl
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableJpaRepositories(repositoryBaseClass = JpaSpecificationStreamExecutorWithProjectionImpl::class)
class DbpaperapiApplication

fun main(args: Array<String>) {
    runApplication<DbpaperapiApplication>(*args)
}
