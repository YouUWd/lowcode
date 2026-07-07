package com.lowcode.meta.domain;

import lombok.Getter;

/**
 * 全局关系基数语义枚举
 */
@Getter
public enum RelationType {
    /** 多对一 */
    MANY_TO_ONE(">"),
    /** 一对多 */
    ONE_TO_MANY("<"),
    /** 一对一 */
    ONE_TO_ONE("-");

    private final String symbol;

    RelationType(String symbol) {
        this.symbol = symbol;
    }

    public static RelationType fromSymbol(String symbol) {
        for (RelationType type : values()) {
            if (type.symbol.equals(symbol)) {
                return type;
            }
        }
        throw new IllegalArgumentException("未知关系基数符号: " + symbol);
    }
}
