package com.lowcode.config;

import com.lowcode.meta.domain.UserContext;

public class UserContextHolder {
    private static final ThreadLocal<UserContext> HOLDER = new ThreadLocal<>();

    public static void set(UserContext ctx)  { HOLDER.set(ctx); }
    public static UserContext get()          { return HOLDER.get(); }
    public static void clear()               { HOLDER.remove(); }
}
