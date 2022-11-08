package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.model.PersonSpecification
import com.vsharkovski.dbpaperapi.model.SearchCriteria
import com.vsharkovski.dbpaperapi.model.SearchOperation
import org.springframework.data.jpa.domain.Specification

class PersonSpecificationBuilder {
    private val params: MutableList<SearchCriteria> = mutableListOf()

    fun with(key: String, operation: String, value: Any, prefix: String, suffix: String): PersonSpecificationBuilder {
        SearchOperation.getSimpleOperation(operation[0])?.let { op ->
            var opToAdd = op
            if (op == SearchOperation.EQUALITY) {
                val startsWithAsterisk = prefix.contains("*")
                val endsWithAsterisk = suffix.contains("*")
                if (startsWithAsterisk && endsWithAsterisk) {
                    opToAdd = SearchOperation.CONTAINS
                } else if (startsWithAsterisk) {
                    opToAdd = SearchOperation.ENDS_WITH
                } else if (endsWithAsterisk) {
                    opToAdd = SearchOperation.STARTS_WITH
                }
            }
            params.add(SearchCriteria(key, opToAdd, value))
        }
        return this
    }

    fun build(): Specification<Person>? =
        if (params.isEmpty()) {
            null
        } else {
            params.foldIndexed(
                PersonSpecification(params[0]) as Specification<Person>
            ) { index, result, curr ->
                if (index == 0) {
                    result
                } else {
                    Specification.where(result).and(PersonSpecification(curr))
                }
//                if (index == 0) {
//                    result
//                } else if (curr.orPredicate) {
//                    Specification.where(result).or(PersonSpecification(curr)) as PersonSpecification
//                } else {
//                    Specification.where(result).and(PersonSpecification(curr)) as PersonSpecification
//                }
            }
        }
}