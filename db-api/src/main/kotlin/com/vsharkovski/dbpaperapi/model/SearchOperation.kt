package com.vsharkovski.dbpaperapi.model

enum class SearchOperation {
    EQUALITY, NEGATION, GREATER_THAN, LESS_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL,
    LIKE;

    companion object {
        // Important: >= before >, and <= before <
        val SIMPLE_OPERATION_SET = listOf(":", "!", ">=", ">", "<=", "<", "~")

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