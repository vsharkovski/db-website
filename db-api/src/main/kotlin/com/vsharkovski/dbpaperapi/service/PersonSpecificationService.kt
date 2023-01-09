package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.*
import org.springframework.data.jpa.domain.Specification
import org.springframework.stereotype.Service
import kotlin.reflect.full.memberProperties
import kotlin.reflect.typeOf

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
        val operation = SearchOperation.getSimpleOperation(criterion.operation) ?: return null

        var key = criterion.key
        var value = criterion.value

        // Ensure the key corresponds to a valid variable.
        val personProperty = Person::class.memberProperties.find { it.name == key } ?: return null

        // Ensure the value can be cast to the variable's type in the case of numeric operators.
        if (SearchOperation.isOperationNumeric(operation)) {
            when (personProperty.returnType) {
                typeOf<Int?>() -> if (value.toIntOrNull() == null) return null
                typeOf<Short?>() -> if (value.toShortOrNull() == null) return null
                typeOf<Long?>() -> if (value.toLongOrNull() == null) return null
                typeOf<Float?>() -> if (value.toFloatOrNull() == null) return null
            }
        }

        // If the criterion specifies to search for a specific name, we actually process the value
        // being searched for and compare it with the nameProcessed variable.
        if (key == "name") {
            key = "nameProcessed"
            value = nameService.processForSearch(criterion.value)
        }

        return SearchCriterion(key, operation, value)
    }
}