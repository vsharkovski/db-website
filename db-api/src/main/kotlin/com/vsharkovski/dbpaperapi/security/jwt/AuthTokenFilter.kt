package com.vsharkovski.dbpaperapi.security.jwt

//import com.vsharkovski.dbpaperapi.security.service.UserDetailsServiceImpl
//import org.slf4j.Logger
//import org.slf4j.LoggerFactory
//import org.springframework.beans.factory.annotation.Autowired
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
//import org.springframework.security.core.context.SecurityContextHolder
//import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import javax.servlet.FilterChain
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

@Component
class AuthTokenFilter : OncePerRequestFilter() {
//    @Autowired
//    private lateinit var jwtUtils: JwtUtils
//    @Autowired
//    private lateinit var userDetailsService: UserDetailsServiceImpl

//    val loggerSLF4J: Logger = LoggerFactory.getLogger(AuthTokenFilter::class.java)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
//        try {
//            val jwt = parseJwt(request)
//            if (jwt != null && jwt.isNotEmpty() && jwtUtils.validateJwtToken(jwt)) {
//                val username = jwtUtils.getUserNameFromJwtToken(jwt)
//                val userDetails = userDetailsService.loadUserByUsername(username)
//                val authentication = UsernamePasswordAuthenticationToken(userDetails,
//                    null, userDetails.authorities)
//                authentication.details = WebAuthenticationDetailsSource().buildDetails(request)
//                SecurityContextHolder.getContext().authentication = authentication
//            }
//        } catch (e: Exception) {
//            loggerSLF4J.error("Cannot set user authentication [{}]", e.message, e)
//        }
        filterChain.doFilter(request, response)
    }

//    private fun parseJwt(request: HttpServletRequest): String? = jwtUtils.getJwtFromCookies(request)
}