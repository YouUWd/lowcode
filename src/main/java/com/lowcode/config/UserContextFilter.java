package com.lowcode.config;

import com.lowcode.meta.domain.UserContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class UserContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse resp,
                                    FilterChain chain) throws ServletException, IOException {
        String role = req.getHeader("X-Role");
        if (role == null || role.isBlank()) {
            role = "anonymous";
        }
        UserContextHolder.set(new UserContext(role.trim()));
        try {
            chain.doFilter(req, resp);
        } finally {
            UserContextHolder.clear();
        }
    }
}
