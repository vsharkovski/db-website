package com.vsharkovski.dbpaperapi.repository

import com.vsharkovski.dbpaperapi.model.Occupation
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import javax.transaction.Transactional

@Repository
interface OccupationRepository : JpaRepository<Occupation, Int> {
    fun findByName(name: String): Occupation?

    fun findAllByType(type: Int): List<Occupation>

    @Transactional
    @Modifying
    @Query("update Occupation o set o.type = :type")
    fun setAllTypes(@Param(value = "type") type: Int)
}