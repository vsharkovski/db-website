package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Occupation
import com.vsharkovski.dbpaperapi.repository.OccupationRepository
import org.springframework.stereotype.Service

@Service
class OccupationService(val occupationRepository: OccupationRepository) {
    fun findOrAddByName(name: String, type: Short): Occupation =
        occupationRepository.findByName(name)?.let {
            if (it.type != type) {
                // Update the type.
                occupationRepository.save(it.copy(type = type))
            } else {
                // All up to date.
                it
            }
        } ?: occupationRepository.save(Occupation(name = name, type = type))

    fun findAll(): List<Occupation> = occupationRepository.findAll()
}