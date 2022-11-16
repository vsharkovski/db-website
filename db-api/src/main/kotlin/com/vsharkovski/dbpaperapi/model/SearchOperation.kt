package com.vsharkovski.dbpaperapi.model

enum class SearchOperation {
    EQUALITY, NEGATION, GREATER_THAN, LESS_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL,
    LIKE, STARTS_WITH, ENDS_WITH, CONTAINS;

    companion object {
        // Important: >= before >, and <= before <
        private val SIMPLE_OPERATION_SET = listOf(":", "!", ">=", ">", "<=", "<", "~")
        val SIMPLE_OPERATION_SET_JOINED = SIMPLE_OPERATION_SET.joinToString("|")

        fun getSimpleOperation(input: String): SearchOperation? = when (input) {
            ":" -> EQUALITY
            "!" -> NEGATION
            ">" -> GREATER_THAN
            "<" -> LESS_THAN
            ">=" -> GREATER_THAN_OR_EQUAL
            "<=" -> LESS_THAN_OR_EQUAL
            "~" -> LIKE
            else -> null
        }

        fun isOperationNumeric(operation: SearchOperation): Boolean = when (operation) {
            EQUALITY, GREATER_THAN, LESS_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL -> {
                true
            }
            else -> {
                false
            }
        }
    }
}