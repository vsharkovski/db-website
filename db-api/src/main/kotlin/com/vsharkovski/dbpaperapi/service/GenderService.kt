package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Gender
import com.vsharkovski.dbpaperapi.repository.GenderRepository
import org.springframework.stereotype.Service

@Service
class GenderService(val genderRepository: GenderRepository) {
    val resultsThisSession: MutableMap<String, Gender> = mutableMapOf()

    fun findOrAddByName(name: String): Gender {
        var result: Gender? = resultsThisSession[name]
        if (result == null) {
            result = genderRepository.findByName(name)
            if (result == null) {
                result = genderRepository.save(Gender(name = name))
            }
            resultsThisSession[name] = result
        }
        return result
    }

    fun findAll(): List<Gender> = genderRepository.findAll()
}
