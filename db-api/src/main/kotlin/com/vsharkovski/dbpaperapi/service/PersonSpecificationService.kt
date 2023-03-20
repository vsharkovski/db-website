package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.*
import org.springframework.data.jpa.domain.Specification
import org.springframework.stereotype.Service
import kotlin.reflect.full.memberProperties
import kotlin.reflect.typeOf

@Service
class PersonSpecificationService(val nameService: NameService) {
    val sortableNullableVariables = listOf("birth", "death")

    fun isAnyCriterionValid(criteria: List<UnprocessedSearchCriterion>): Boolean =
        criteria.any { createCriterion(it) != null }

    /**
     * Create a specification by processing unprocessed criteria and using the valid ones.
     * @return The resulting specification, or null if there were no valid criteria.
     * This includes the case of no criteria.
     */
    fun createSpecification(
        unprocessedCriteria: List<UnprocessedSearchCriterion>,
        sortState: SortState? = null
    ): Specification<Person>? {
        var foundAtLeastOneValidCriterion = false
        var specification: Specification<Person> = Specification.where(null)

        for (unprocessedCriterion in unprocessedCriteria) {
            val criterion = createCriterion(unprocessedCriterion)
            if (criterion != null) {
                foundAtLeastOneValidCriterion = true
                specification = Specification.where(specification).and(PersonSpecification(criterion))
            }
        }

        if (!foundAtLeastOneValidCriterion) {
            // No valid criteria found.
            return null
        }

        // If sorting by a variable that is nullable, also exclude results with that case.
        if (sortState != null && sortState.variable in sortableNullableVariables) {
            specification = Specification.where(specification).and { root, _, builder ->
                builder.isNotNull(root.get<Any>(sortState.variable))
            }
        }

        return specification
    }

    private fun createCriterion(criterion: UnprocessedSearchCriterion): SearchCriterion? {
        // Get the SearchOperation enum value from the string form.
        val operation = SearchOperation.getSimpleOperation(criterion.operation) ?: return null

        // Ensure the key corresponds to a valid variable.
        val personProperty = Person::class.memberProperties.find { it.name == criterion.key } ?: return null

        // Ensure the value can be cast to the variable's type in the case of numeric operators.
        if (SearchOperation.isOperationNumeric(operation)) {
            when (personProperty.returnType) {
                typeOf<Int?>() -> if (criterion.value.toIntOrNull() == null) return null
                typeOf<Short?>() -> if (criterion.value.toShortOrNull() == null) return null
                typeOf<Long?>() -> if (criterion.value.toLongOrNull() == null) return null
                typeOf<Float?>() -> if (criterion.value.toFloatOrNull() == null) return null
            }
        }

        // If the criterion specifies to search for a specific name, we actually process the value
        // being searched for and compare it with the nameProcessed variable.
        return if (criterion.key == "name") {
            SearchCriterion("nameProcessed", operation, nameService.processForSearch(criterion.value))
        } else {
            SearchCriterion(criterion.key, operation, criterion.value)
        }
    }
}