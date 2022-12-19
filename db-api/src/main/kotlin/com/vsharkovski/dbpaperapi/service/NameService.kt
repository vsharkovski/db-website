package com.vsharkovski.dbpaperapi.service

import org.springframework.stereotype.Service
import java.text.Normalizer

@Service
class NameService {
    val nonAsciiRegex = Regex("[^\\x00-\\x7F]+")
    val nonLowercaseLetterOrDigitOrSpaceRegex = Regex("[^a-z0-9 ]")
    val nonSpacingMarksRegex = Regex("\\p{Mn}+}")

    fun processForSearch(text: String): String =
        text
            .lowercase()
            .replace(nonLowercaseLetterOrDigitOrSpaceRegex, "")

//    fun process(text: String): String =
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