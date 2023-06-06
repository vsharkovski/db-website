package com.vsharkovski.dbpaperapi.repository

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.model.PersonIdAndNames
import com.vsharkovski.dbpaperapi.model.PersonNoRawData
import com.vsharkovski.dbpaperapi.model.PersonTimelineData
import com.vsharkovski.dbpaperapi.repository.custom.JpaSpecificationStreamExecutorWithProjection
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Slice
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.PagingAndSortingRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import javax.transaction.Transactional

@Repository
interface PersonRepository : JpaRepository<Person, Long>, PagingAndSortingRepository<Person, Long>,
    JpaSpecificationStreamExecutorWithProjection<Person, Long> {
    fun findBy(pageable: Pageable): Slice<PersonIdAndNames>

    @Query("""
        select new com.vsharkovski.dbpaperapi.model.PersonTimelineData(
            p.wikidataCode, p.birth, p.notabilityIndex,
            p.genderId, p.level1MainOccId, p.citizenship1BId)
        from Person p
        where p.birth is not null
        order by p.notabilityIndex desc
    """)
    fun findTimelineData(page: Pageable): Slice<PersonTimelineData>

    fun findByWikidataCode(wikidataCode: Int): PersonNoRawData?

    @Transactional
    @Modifying
    @Query("update Person p set p.nameProcessed = :nameProcessed where p.id = :id")
    fun setNameProcessed(
        @Param(value = "id") id: Long,
        @Param(value = "nameProcessed") nameProcessed: String
    )
}