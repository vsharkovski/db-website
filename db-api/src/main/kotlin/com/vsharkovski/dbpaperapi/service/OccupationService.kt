package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Occupation
import com.vsharkovski.dbpaperapi.repository.OccupationRepository
import org.springframework.stereotype.Service
import java.util.concurrent.ConcurrentHashMap

@Service
class OccupationService(val occupationRepository: OccupationRepository) {
    /*
    Caching results is useful for at least two reasons:
    - Prevents execution of concurrent SQL methods when importing the database using multithreading
    - Speeds up things because we use a hashmap lookup instead of a database query.

    It works because we do not modify any entities during importing, and only insert.
     */
    val cachedResults = ConcurrentHashMap(findAll().associateBy { it.name })

    final fun findAll(): List<Occupation> = occupationRepository.findAll()

    fun findOrAddByName(name: String, type: Short): Occupation {
        var result: Occupation? = cachedResults[name]
        if (result != null) return result

        result = occupationRepository.findByName(name)
        if (result != null) return result

        try {
            result = occupationRepository.save(Occupation(name = name, type = type))
            cachedResults[name] = result
        } catch (e: Exception) {
            result = occupationRepository.findByName(name)
        }

        return result!!
    }

//    fun findOrAddByName(name: String, type: Short): Occupation =
//        occupationRepository.findByName(name)?.let {
//            if (it.type != type) {
//                // Update the type.
//                occupationRepository.save(it.copy(type = type))
//            } else {
//                // All up to date.
//                it
//            }
//        } ?: occupationRepository.save(Occupation(name = name, type = type))

}