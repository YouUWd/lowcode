package com.lowcode.meta.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 当前请求的用户上下文。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserContext {
    private String roleCode;
}
