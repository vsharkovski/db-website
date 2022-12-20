package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Citizenship
import com.vsharkovski.dbpaperapi.repository.CitizenshipRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class CitizenshipService(
    val citizenshipRepository: CitizenshipRepository,
    val nameService: NameService
) {
    private val logger: Logger = LoggerFactory.getLogger(CitizenshipService::class.java)

    val resultsThisSession: MutableMap<String, Citizenship> = mutableMapOf()
    fun findAll(): List<Citizenship> = citizenshipRepository.findAll()

    fun findOrAddByName(name: String): Citizenship {
        var result: Citizenship? = resultsThisSession[name]
        if (result == null) {
            result = citizenshipRepository.findByName(name)
            if (result == null) {
                result = citizenshipRepository.save(
                    Citizenship(
                        name = name,
                        nameProcessed = nameService.processForSearch(name),
                        nameReadable = nameService.processForReadability(name)
                    )
                )
            }
            resultsThisSession[name] = result
        }
        return result
    }

    fun processAllCitizenshipNamesForReadability() {
        logger.info("Citizenship name processing for readability: starting")
        citizenshipRepository.findAll().forEach {
            citizenshipRepository.save(it.copy(nameReadable = nameService.processForReadability(it.name)))
        }
        logger.info("Citizenship name processing for readability: updating special cases")
        val processedToReadablePairs = listOf(
            "s_o tom_ and pr_ncipe" to "Sao Tome and Principe",
            "polish_lithuanian commonwealth" to "Polish–Lithuanian Commonwealth"
        )
        processedToReadablePairs.forEach { (processed, readable) ->
            citizenshipRepository.findAllByNameProcessed(processed).forEach {
                logger.info("Citizenship name processing for readability: found special [{}]", it)
                citizenshipRepository.save(it.copy(nameReadable = readable))
            }
        }
        logger.info("Citizenship name processing for readability: finished")
    }

    fun processAllCitizenshipNamesForSearch() {
        logger.info("Citizenship name processing for search: starting")
        citizenshipRepository.findAll().forEach {
            citizenshipRepository.save(it.copy(nameProcessed = nameService.processForSearch(it.name)))
        }
        logger.info("Citizenship name processing for search: finished")
    }
}