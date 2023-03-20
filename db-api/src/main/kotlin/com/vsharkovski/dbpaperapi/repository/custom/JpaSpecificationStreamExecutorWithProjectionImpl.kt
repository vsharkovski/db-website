package com.vsharkovski.dbpaperapi.repository.custom

import com.github.ladynev.specification.lib.JpaSpecificationExecutorWithProjectionImpl
import com.github.ladynev.specification.lib.MyResultProcessor
import com.github.ladynev.specification.lib.ReturnedType
import com.github.ladynev.specification.lib.TupleConverter
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.domain.Specification
import org.springframework.data.jpa.repository.support.JpaEntityInformation
import org.springframework.data.projection.ProjectionFactory
import org.springframework.data.projection.SpelAwareProxyProjectionFactory
import java.io.Serializable
import java.util.stream.Stream
import javax.persistence.EntityManager

class JpaSpecificationStreamExecutorWithProjectionImpl<T : Any, ID : Serializable>(
    entityInformation: JpaEntityInformation<T, ID>,
    entityManager: EntityManager
) : JpaSpecificationExecutorWithProjectionImpl<T, ID>(entityInformation, entityManager),
    JpaSpecificationStreamExecutorWithProjection<T, ID> {

    private val projectionFactory: ProjectionFactory = SpelAwareProxyProjectionFactory()

    override fun <R> streamBy(
        specification: Specification<T>,
        projectionType: Class<R>
    ): Stream<R> {
        val returnedType = ReturnedType.of(projectionType, domainClass, projectionFactory)
        val query = getTupleQuery(specification, Sort.unsorted(), returnedType)
        val resultProcessor = MyResultProcessor(projectionFactory, returnedType)
        return resultProcessor.processResult(query.resultStream, TupleConverter(returnedType))
    }
}