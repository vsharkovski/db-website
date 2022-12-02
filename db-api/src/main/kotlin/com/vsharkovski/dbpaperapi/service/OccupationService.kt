package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Occupation
import com.vsharkovski.dbpaperapi.repository.OccupationRepository
import org.springframework.stereotype.Service

@Service
class OccupationService(val occupationRepository: OccupationRepository) {
    fun findOrAddByName(name: String): Occupation =
        occupationRepository.findByName(name) ?: occupationRepository.save(Occupation(name = name))

    fun findAll(): List<Occupation> = occupationRepository.findAll()
}