package com.lowcode.engine;

import com.lowcode.meta.domain.FieldMeta;
import com.lowcode.meta.domain.FieldPerm;
import com.lowcode.meta.domain.ModuleMeta;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Stream;

/**
 * 纯白名单机制权限解析器。
 */
@Component
@RequiredArgsConstructor
public class PermissionResolver {

    private final DSLContext dsl;

    /**
     * 批量解析：一次性查出该角色在该模块内的所有配置，
     * 没有配置记录的字段一律返回 0 (FieldPerm.NONE)。
     */
    public Map<Long, FieldPerm> resolveAll(ModuleMeta meta, String moduleId, String roleCode) {
        Map<Long, Integer> configMap = loadConfigMap(moduleId, roleCode);
        Map<Long, FieldPerm> result = new HashMap<>();

        allFields(meta).forEach(field -> {
            Integer configuredVal = configMap.get(field.getId());
            int permVal = (configuredVal != null) ? configuredVal : 0;
            result.put(field.getId(), new FieldPerm(permVal));
        });
        return result;
    }

    private Map<Long, Integer> loadConfigMap(String moduleId, String roleCode) {
        return dsl.select(DSL.field("field_meta_id", Long.class),
                          DSL.field("perm_value", Integer.class))
                  .from(DSL.table(DSL.name("field_permission")))
                  .where(DSL.field(DSL.name("module_id")).eq(moduleId)
                     .and(DSL.field(DSL.name("role_code")).eq(roleCode)))
                  .fetchMap(
                      r -> r.get(DSL.field(DSL.name("field_meta_id"), Long.class)),
                      r -> r.get(DSL.field(DSL.name("perm_value"), Integer.class))
                  );
    }

    private List<FieldMeta> allFields(ModuleMeta meta) {
        List<FieldMeta> all = new ArrayList<>();
        Stream.of(meta.getListTables(), meta.getSubTables(), meta.getJoinTables(), meta.getRelationTables())
              .filter(Objects::nonNull)
              .flatMap(List::stream)
              .forEach(t -> {
                  if (t.getFields() != null) {
                      all.addAll(t.getFields());
                  }
              });
        // 主表也可能是单独或在 listTables 里的，防重防漏
        if (meta.getMainTable() != null && meta.getMainTable().getFields() != null) {
            all.addAll(meta.getMainTable().getFields());
        }
        
        // 去重
        Map<Long, FieldMeta> uniqueMap = new LinkedHashMap<>();
        for (FieldMeta f : all) {
            if (f != null && f.getId() != null) {
                uniqueMap.put(f.getId(), f);
            }
        }
        return new ArrayList<>(uniqueMap.values());
    }
}
