package com.vsharkovski.dbpaperapi.service

import org.springframework.stereotype.Service
import java.text.Normalizer

@Service
class NameService {
    val nonAsciiRegex = Regex("[^\\x00-\\x7F]+")
    val nonLowercaseDigitSpaceWildcardRegex = Regex("[^a-z0-9 _]")
    val nonSpacingMarksRegex = Regex("\\p{Mn}+}")

    fun processForSearch(text: String): String =
        /*
        1. Make lowercase for case insensitivity
        2. Turn _ into spaces
        3. Turn user-inputted wildcards (?) into SQL wildcards (_)
        3. Turn all non-ASCII characters into SQL wildcards (_)
        4. Remove all remaining characters that are not digits, spaces, or wildcards
         */
        text
            .lowercase()
            .replace('_', ' ')
            .replace('?', '_')
            .replace(nonAsciiRegex, "_")
            .replace(nonLowercaseDigitSpaceWildcardRegex, "")

//    fun processNormalize(text: String): String =
//        Normalizer
//            .normalize(text, Normalizer.Form.NFD)
//            .replace(nonSpacingMarksRegex, "")
//            .replace('_', ' ')
//            .lowercase()

    fun processForReadability(text: String): String =
        Normalizer
            .normalize(text, Normalizer.Form.NFD)
            .replace(nonSpacingMarksRegex, "")
            .replace('_', ' ')
}