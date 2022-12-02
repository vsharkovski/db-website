package com.vsharkovski.dbpaperapi.repository

import com.vsharkovski.dbpaperapi.model.Citizenship
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface CitizenshipRepository : JpaRepository<Citizenship, Int> {
    fun findByName(name: String): Citizenship?

    fun findAllByNameProcessed(name: String): List<Citizenship>
}