package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.*
import org.springframework.data.jpa.domain.Specification
import org.springframework.stereotype.Service

@Service
class PersonSpecificationService(val nameService: NameService) {
    val sortableNullableVariables = listOf("birth", "death")

    fun createSpecification(
        unprocessedCriteria: List<UnprocessedSearchCriterion>,
        sortState: SortState
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

        // If there are no valid criteria, there is no need for a specification.
        if (!foundAtLeastOneValidCriterion) {
            return null
        }

        // If sorting by a variable that is nullable, also exclude results with that case.
        if (sortState.variable in sortableNullableVariables) {
            specification = Specification.where(specification).and { root, _, builder ->
                builder.isNotNull(root.get<Any>(sortState.variable))
            }
        }

        return specification
    }

    private fun createCriterion(criterion: UnprocessedSearchCriterion): SearchCriterion? {
        // Get the SearchOperation enum value from the string form.
        var operation = SearchOperation.getSimpleOperation(criterion.operation) ?: return null

        var key = criterion.key
        var value: Any = criterion.value

        // If the criterion specifies to search for a specific name, we actually process the value
        // being searched for and compare it with the nameProcessed variable.
        if (key == "name") {
            key = "nameProcessed"
            value = nameService.processForSearch(criterion.value)
        }

        // Parse starting and ending wildcards.
        if (operation == SearchOperation.EQUALITY) {
            val startsWithAsterisk = criterion.prefix.contains("*")
            val endsWithAsterisk = criterion.suffix.contains("*")
            if (startsWithAsterisk && endsWithAsterisk) {
                operation = SearchOperation.CONTAINS
            } else if (startsWithAsterisk) {
                operation = SearchOperation.ENDS_WITH
            } else if (endsWithAsterisk) {
                operation = SearchOperation.STARTS_WITH
            }
        }

        // Parse minus.
        if (
            SearchOperation.isOperationNumeric(operation)
            && criterion.prefix == "-"
            && criterion.value.toIntOrNull() != null
        ) {
            // Negate the value.
            value = -criterion.value.toInt()
        }

        return SearchCriterion(key, operation, value)
    }
}