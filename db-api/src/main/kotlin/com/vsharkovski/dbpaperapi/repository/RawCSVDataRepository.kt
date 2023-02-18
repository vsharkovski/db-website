package com.vsharkovski.dbpaperapi.repository

import com.vsharkovski.dbpaperapi.model.RawCSVData
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface RawCSVDataRepository : JpaRepository<RawCSVData, Long> {
    @Query("select d.data from RawCSVData d where d.personId = :personId")
    fun findDataByPersonId(personId: Long): String?
}