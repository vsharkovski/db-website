package com.vsharkovski.dbpaperapi.repository.custom

import com.github.ladynev.specification.lib.JpaSpecificationExecutorWithProjection
import org.springframework.data.jpa.domain.Specification
import org.springframework.data.repository.NoRepositoryBean
import java.io.Serializable
import java.util.stream.Stream

/*
See:
https://itnext.io/scrolling-through-large-datasets-in-spring-data-jpa-with-streams-and-specification-2fd975129758

https://stackoverflow.com/questions/66317464/can-not-autowire-jpaentityinformation-when-extending-simplejparepository-of-spri

https://github.com/v-ladynev/specification-with-projection-embeded
 */

@NoRepositoryBean
interface JpaSpecificationStreamExecutorWithProjection<T : Any, ID: Serializable> : JpaSpecificationExecutorWithProjection<T, ID> {
    fun <R> streamBy(specification: Specification<T>, projectionType: Class<R>): Stream<R>
}