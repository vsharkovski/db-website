package com.vsharkovski.dbpaperapi.repository

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.model.PersonIdAndNames
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Slice
import org.springframework.data.jpa.domain.Specification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.PagingAndSortingRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import javax.transaction.Transactional

@Repository
interface PersonRepository : JpaRepository<Person, Long>, PagingAndSortingRepository<Person, Long> {
    fun findAll(specification: Specification<Person>, pageable: Pageable): Slice<Person>

    fun findBy(pageable: Pageable): Slice<PersonIdAndNames>

    fun findByWikidataCode(wikidataCode: Int): Person?

    @Transactional
    @Modifying
    @Query("update Person p set p.notabilityRank = :notabilityRank where p.wikidataCode = :wikidataCode")
    fun setNotabilityRank(
        @Param(value = "wikidataCode") wikidataCode: Int,
        @Param(value = "notabilityRank") notabilityRank: Long
    )

    @Transactional
    @Modifying
    @Query("update Person p set p.nameProcessed = :nameProcessed where p.id = :id")
    fun setNameProcessed(
        @Param(value = "id") id: Long,
        @Param(value = "nameProcessed") nameProcessed: String
    )
}