package com.tomapedido.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;



@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(
                        "/auth/register",
                        "/auth/login",
                        "/auth/check-phone/**",
                        "/public/**"
                    )
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/business/**")
                    .permitAll()
                    .requestMatchers("/products/**", "/categories/**", "/tenant/trial")
                    .hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/business")
                    .hasRole("ADMIN")
                    .requestMatchers(
                        HttpMethod.PATCH,
                        "/business/status",
                        "/business/customization"
                    )
                    .hasRole("ADMIN")
                    .anyRequest().authenticated()
                )
                .exceptionHandling(exceptionHandling -> exceptionHandling
                    .authenticationEntryPoint((request, response, exception) ->
                        response.sendError(HttpStatus.UNAUTHORIZED.value())
                    )
                    .accessDeniedHandler((request, response, exception) ->
                        response.sendError(HttpStatus.FORBIDDEN.value())
                    )
                )
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(
                                "http://localhost:5500",
                                "http://127.0.0.1:5500",
                                "http://192.168.100.32:5500"
                        )
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}
