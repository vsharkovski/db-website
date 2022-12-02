package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Gender
import com.vsharkovski.dbpaperapi.repository.GenderRepository
import org.springframework.stereotype.Service

@Service
class GenderService(val genderRepository: GenderRepository) {
    fun findOrAddByName(name: String): Gender =
        genderRepository.findByName(name) ?: genderRepository.save(Gender(name = name))

    fun findAll(): List<Gender> = genderRepository.findAll()
}
