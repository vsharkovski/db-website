package com.vsharkovski.dbpaperapi.repository

import com.vsharkovski.dbpaperapi.model.Gender
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface GenderRepository : JpaRepository<Gender, Int> {
    fun findByName(name: String): Gender?
}