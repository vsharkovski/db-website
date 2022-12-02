package com.vsharkovski.dbpaperapi.service

import com.vsharkovski.dbpaperapi.model.Person
import org.springframework.data.jpa.domain.Specification
import org.springframework.stereotype.Service

@Service
class PersonSpecificationBuilderService(val nameService: NameService) {
    fun createBuilder(): PersonSpecificationBuilder = PersonSpecificationBuilder()

    fun with(
        builder: PersonSpecificationBuilder,
        key: String,
        operation: String,
        value: String,
        prefix: String,
        suffix: String
    ) =
        if (key == "name") {
            builder.with(
                "nameProcessed", operation, nameService.processForSearch(value), prefix, suffix
            )
        } else {
            builder.with(key, operation, value, prefix, suffix)
        }

    fun build(builder: PersonSpecificationBuilder): Specification<Person>? =
        builder.build()
}