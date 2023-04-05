package com.vsharkovski.dbpaperapi.repository

import com.vsharkovski.dbpaperapi.model.Occupation
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface OccupationRepository : JpaRepository<Occupation, Int> {
    fun findByName(name: String): Occupation?
}