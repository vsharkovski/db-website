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
        SearchOperation.getSimpleOperation(operation)?.let { op ->
            var opToAdd = op
            var valueToAdd: Any = value

            // Parse string wildcards
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

            // Parse minus
            if (SearchOperation.isOperationNumeric(opToAdd)
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