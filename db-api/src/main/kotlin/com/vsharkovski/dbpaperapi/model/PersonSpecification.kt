package com.vsharkovski.dbpaperapi.model

import org.springframework.data.jpa.domain.Specification
import javax.persistence.criteria.CriteriaBuilder
import javax.persistence.criteria.CriteriaQuery
import javax.persistence.criteria.Predicate
import javax.persistence.criteria.Root

data class PersonSpecification<T>(
    private val criterion: SearchCriterion
) : Specification<T> {
    override fun toPredicate(
        root: Root<T>,
        query: CriteriaQuery<*>,
        builder: CriteriaBuilder
    ): Predicate? = when (criterion.operation) {
        SearchOperation.EQUALITY ->
            builder.equal(root.get<Any>(criterion.key), criterion.value)
        SearchOperation.NEGATION ->
            builder.notEqual(root.get<Any>(criterion.key), criterion.value)
        SearchOperation.GREATER_THAN ->
            builder.greaterThan(root.get(criterion.key), criterion.value)
        SearchOperation.LESS_THAN ->
            builder.lessThan(root.get(criterion.key), criterion.value)
        SearchOperation.GREATER_THAN_OR_EQUAL ->
            builder.greaterThanOrEqualTo(root.get(criterion.key), criterion.value)
        SearchOperation.LESS_THAN_OR_EQUAL ->
            builder.lessThanOrEqualTo(root.get(criterion.key), criterion.value)
        SearchOperation.LIKE ->
            builder.like(root.get(criterion.key), criterion.value)
    }
}
