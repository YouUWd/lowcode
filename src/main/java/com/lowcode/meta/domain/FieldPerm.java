package com.lowcode.meta.domain;

import lombok.Getter;

/**
 * 字段权限值对象。
 *
 * 位定义: r=4(读), w=2(写/新增), u=1(更新)
 * 示例: 7=rwu, 6=rw-, 4=r--, 2=-w-, 0=---
 */
@Getter
public class FieldPerm {
    private final int value;

    public FieldPerm(int value) {
        this.value = value & 7;
    }

    public boolean canRead()   { return (value & 4) != 0; }
    public boolean canWrite()  { return (value & 2) != 0; }
    public boolean canUpdate() { return (value & 1) != 0; }

    public static final FieldPerm RWU  = new FieldPerm(7);
    public static final FieldPerm RW   = new FieldPerm(6);
    public static final FieldPerm R    = new FieldPerm(4);
    public static final FieldPerm W    = new FieldPerm(2);
    public static final FieldPerm NONE = new FieldPerm(0);

    public String toSymbol() {
        return "" + (canRead() ? 'r' : '-')
                  + (canWrite() ? 'w' : '-')
                  + (canUpdate() ? 'u' : '-');
    }
}
