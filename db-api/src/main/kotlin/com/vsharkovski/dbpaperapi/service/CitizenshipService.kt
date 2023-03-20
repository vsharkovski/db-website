package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Citizenship
import com.vsharkovski.dbpaperapi.repository.CitizenshipRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.util.concurrent.ConcurrentHashMap

@Service
class CitizenshipService(
    val citizenshipRepository: CitizenshipRepository,
    val nameService: NameService
) {
    private val logger: Logger = LoggerFactory.getLogger(this::class.java)

    /*
    Caching results is useful for at least two reasons:
    - Prevents execution of concurrent SQL methods when importing the database using multithreading
    - Speeds up things because we use a hashmap lookup instead of a database query.

    It works because we do not modify any entities during importing, and only insert.
     */
    val cachedResults = ConcurrentHashMap(findAll().associateBy { it.name })

    final fun findAll(): List<Citizenship> = citizenshipRepository.findAll()

    fun findOrAddByName(name: String): Citizenship {
        var result: Citizenship? = cachedResults[name]
        if (result != null) return result

        result = citizenshipRepository.findByName(name)
        if (result != null) return result

        try {
            result = citizenshipRepository.save(
                Citizenship(
                    name = name,
                    nameProcessed = nameService.processForSearch(name),
                    nameReadable = nameService.processForReadability(name)
                )
            )
            cachedResults[name] = result
        } catch (e: Exception) {
            // This happens when another thread inserted the result
            result = citizenshipRepository.findByName(name)
        }

        return result!!
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