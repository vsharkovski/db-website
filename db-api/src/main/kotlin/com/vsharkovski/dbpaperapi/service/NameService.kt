package com.vsharkovski.dbpaperapi.service

import org.springframework.stereotype.Service
import java.text.Normalizer

@Service
class NameService {
//    val nonAsciiRegex = Regex("[^\\x00-\\x7F]+")
//    val nonLowercaseDigitSpaceWildcardRegex = Regex("[^a-z0-9 _%]")
    val nonSpacingMarksRegex = Regex("\\p{Mn}+}")
    val diacriticalMarksRegex = Regex("\\p{InCombiningDiacriticalMarks}+")

    fun processForSearch(text: String): String = buildString {
        val noAccents = Normalizer
            .normalize(text, Normalizer.Form.NFD)
            .replace(diacriticalMarksRegex, "")

        for (c in noAccents) {
            when (c) {
                // Underscores from names are spaces.
                '_' -> append(' ')
                // * and ? wildcards should be the appropriate SQL wildcards.
                '*' -> append('%')
                '?' -> append('_')
                // Spaces, a-z, 0-9 are the same.
                ' ', in 'a'..'z', in '0'..'9' -> append(c)
                // A-Z should be lowercase.
                in 'A'..'Z' -> append(c.lowercase())
                // Otherwise, use single-character SQL wildcard.
                else -> append('_')
            }
        }
    }

//    fun processForSearch(text: String): String =
//        /*
//        1. Separate accents
//        2. Remove accents
//        3. Make lowercase for case insensitivity
//        4. Turn _ into spaces
//        5. Turn all user-inputted multi-character wildcards (*) into SQL multi-character wildcards (%)
//        6. Turn user-inputted single-character wildcards (?) into SQL single-character wildcards (_)
//        7. Turn all non-ASCII characters into SQL single-character wildcards (_)
//        8. Remove all remaining characters that are not digits, spaces, or wildcards
//         */
//        Normalizer
//            .normalize(text, Normalizer.Form.NFD)
//            .replace(diacriticalMarksRegex, "")
//            .lowercase()
//            .replace('_', ' ')
//            .replace('*', '%')
//            .replace('?', '_')
//            .replace(nonAsciiRegex, "_")
//            .replace(nonLowercaseDigitSpaceWildcardRegex, "")

    fun processForReadability(text: String): String =
        Normalizer
            .normalize(text, Normalizer.Form.NFD)
            .replace(nonSpacingMarksRegex, "")
            .replace('_', ' ')
}