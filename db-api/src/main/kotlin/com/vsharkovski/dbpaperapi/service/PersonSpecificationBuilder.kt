package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import com.vsharkovski.dbpaperapi.model.PersonSpecification
import com.vsharkovski.dbpaperapi.model.SearchCriteria
import com.vsharkovski.dbpaperapi.model.SearchOperation
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.data.jpa.domain.Specification

class PersonSpecificationBuilder {
    private val logger: Logger = LoggerFactory.getLogger(PersonSpecificationBuilder::class.java)

    private val params: MutableList<SearchCriteria> = mutableListOf()

    fun with(key: String, operation: String, value: String, prefix: String, suffix: String): PersonSpecificationBuilder {
        SearchOperation.getSimpleOperation(operation[0])?.let { op ->
            var opToAdd = op
            var valueToAdd: Any = value
            var isStringOperation = false

            // Parse string wildcards
            if (op == SearchOperation.EQUALITY) {
                val startsWithAsterisk = prefix.contains("*")
                val endsWithAsterisk = suffix.contains("*")
                if (startsWithAsterisk && endsWithAsterisk) {
                    opToAdd = SearchOperation.CONTAINS
                    isStringOperation = true
                } else if (startsWithAsterisk) {
                    opToAdd = SearchOperation.ENDS_WITH
                    isStringOperation = true
                } else if (endsWithAsterisk) {
                    opToAdd = SearchOperation.STARTS_WITH
                    isStringOperation = true
                }
            }

            // Parse minus
            if (!isStringOperation
                && (opToAdd == SearchOperation.EQUALITY || opToAdd == SearchOperation.GREATER_THAN ||
                        opToAdd == SearchOperation.LESS_THAN)
                && prefix == "-"
                && value.toIntOrNull() != null
            ) {
                valueToAdd = -value.toInt()
            }

//            logger.info(
//                "Builder from [key={} operation={} value={} prefix={} suffix={}] added [key={} op={} val={}]",
//                key,
//                operation,
//                value,
//                prefix,
//                suffix,
//                key,
//                opToAdd,
//                valueToAdd
//            )

            params.add(SearchCriteria(key, opToAdd, valueToAdd))
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