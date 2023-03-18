package com.vsharkovski.dbpaperapi

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling
import th.co.geniustree.springdata.jpa.repository.support.JpaSpecificationExecutorWithProjectionImpl

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableJpaRepositories(repositoryBaseClass = JpaSpecificationExecutorWithProjectionImpl::class)
class DbpaperapiApplication

fun main(args: Array<String>) {
	runApplication<DbpaperapiApplication>(*args)
}
