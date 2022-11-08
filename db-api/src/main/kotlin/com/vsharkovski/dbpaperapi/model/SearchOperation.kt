package com.vsharkovski.dbpaperapi.model

enum class SearchOperation {
    EQUALITY, NEGATION, GREATER_THAN, LESS_THAN, LIKE, STARTS_WITH, ENDS_WITH, CONTAINS;

    companion object {
        private val SIMPLE_OPERATION_SET = listOf(":", "!", ">", "<", "~")
        val SIMPLE_OPERATION_SET_JOINED = SIMPLE_OPERATION_SET.joinToString("|")

        fun getSimpleOperation(input: Char): SearchOperation? = when (input) {
            ':' -> EQUALITY
            '!' -> NEGATION
            '>' -> GREATER_THAN
            '<' -> LESS_THAN
            '~' -> LIKE
            else -> null
        }
    }
}