package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Citizenship
import com.vsharkovski.dbpaperapi.repository.CitizenshipRepository
import com.vsharkovski.dbpaperapi.repository.PersonRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class CitizenshipService(
    val citizenshipRepository: CitizenshipRepository,
    val nameService: NameService
) {
    private val logger: Logger = LoggerFactory.getLogger(CitizenshipService::class.java)

    fun findOrAddByName(name: String): Citizenship =
        citizenshipRepository.findByName(name) ?: citizenshipRepository.save(
            Citizenship(
                name = name,
                nameProcessed = nameService.processForSearch(name),
                nameReadable = nameService.processForReadability(name)
            )
        )

    fun findAll(): List<Citizenship> = citizenshipRepository.findAll()

    fun cleanUpCitizenshipNames() {
        logger.info("Citizenship names: processing for readability")
        citizenshipRepository.findAll().forEach {
            citizenshipRepository.save(it.copy(nameReadable = nameService.processForReadability(it.name)))
        }
        logger.info("Citizenship names: updating special cases")
        val processedToReadablePairs = listOf(
            "sotomandprncipe" to "Sao Tome and Principe",
            "polishlithuaniancommonwealth" to "Polish–Lithuanian Commonwealth"
        )
        processedToReadablePairs.forEach { (processed, readable) ->
            citizenshipRepository.findAllByNameProcessed(processed).forEach {
                logger.info("Found special [{}]", it)
                citizenshipRepository.save(it.copy(nameReadable = readable))
            }
        }
        logger.info("Citizenship names: finished")
    }

//    fun cleanUpPersonNames() {
//        logger.info("Person names: processing for readability")
//        val batchSize = 1000
//        val slice = personRepository.findAll(PageRequest.of(0, batchSize))
//        slice.content.forEach { personRepository.save(it.copy(nameReadable = ) }
//    }

}