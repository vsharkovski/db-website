package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Gender
import com.vsharkovski.dbpaperapi.repository.GenderRepository
import org.springframework.stereotype.Service
import java.util.concurrent.ConcurrentHashMap

@Service
class GenderService(val genderRepository: GenderRepository) {
    /*
    Caching results is useful for at least two reasons:
    - Prevents execution of concurrent SQL methods when importing the database using multithreading
    - Speeds up things because we use a hashmap lookup instead of a database query.

    It works because we do not modify any entities during importing, and only insert.
     */
    val cachedResults = ConcurrentHashMap(findAll().associateBy { it.name })

    final fun findAll(): List<Gender> = genderRepository.findAll()

    fun findOrAddByName(name: String): Gender {
        var result: Gender? = cachedResults[name]
        if (result != null) return result

        result = genderRepository.findByName(name)
        if (result != null) return result

        try {
            result = genderRepository.save(Gender(name = name))
            cachedResults[name] = result
        } catch (e: Exception) {
            result = genderRepository.findByName(name)
        }

        return result!!
    }
}
