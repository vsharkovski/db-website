package com.vsharkovski.dbpaperapi.model

import org.springframework.data.jpa.domain.Specification
import javax.persistence.criteria.CriteriaBuilder
import javax.persistence.criteria.CriteriaQuery
import javax.persistence.criteria.Predicate
import javax.persistence.criteria.Root

data class PersonSpecification(
    private val criteria: SearchCriteria
) : Specification<Person> {
    override fun toPredicate(
        root: Root<Person>,
        query: CriteriaQuery<*>,
        builder: CriteriaBuilder
    ): Predicate? = when (criteria.operation) {
        SearchOperation.EQUALITY ->
            builder.equal(root.get<Any>(criteria.key), criteria.value)
        SearchOperation.NEGATION ->
            builder.notEqual(root.get<Any>(criteria.key), criteria.value)
        SearchOperation.GREATER_THAN ->
            builder.greaterThan(root.get(criteria.key), criteria.value.toString())
        SearchOperation.LESS_THAN ->
            builder.lessThan(root.get(criteria.key), criteria.value.toString())
        SearchOperation.GREATER_THAN_OR_EQUAL ->
            builder.greaterThanOrEqualTo(root.get(criteria.key), criteria.value.toString())
        SearchOperation.LESS_THAN_OR_EQUAL ->
            builder.lessThanOrEqualTo(root.get(criteria.key), criteria.value.toString())
        SearchOperation.LIKE ->
            builder.like(root.get(criteria.key), criteria.value.toString())
        SearchOperation.STARTS_WITH ->
            builder.like(root.get(criteria.key), criteria.value.toString() + "%")
        SearchOperation.ENDS_WITH ->
            builder.like(root.get(criteria.key), "%" + criteria.value.toString())
        SearchOperation.CONTAINS ->
            builder.like(root.get(criteria.key), "%" + criteria.value.toString() + "%")
    }
}
