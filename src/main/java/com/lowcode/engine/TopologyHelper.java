package com.lowcode.engine;

import com.lowcode.meta.domain.*;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class TopologyHelper {

    /**
     * 拓扑识别并装配 ModuleMeta 中的主从表、JOIN表、以及多对多关系
     */
    public void inferAndAssemble(ModuleMeta meta) {
        if (meta == null || meta.getTables() == null || meta.getTables().isEmpty()) {
            return;
        }

        // 清除现有的装配分类（防止重复装配）
        meta.setMainTable(null);
        meta.getSubTables().clear();
        meta.getListTables().clear();
        meta.getJoinTables().clear();
        meta.getRelationTables().clear();

        List<TableMeta> tables = meta.getTables();
        List<RelationMeta> allRelations = meta.getRelations();

        // 1. 默认第一个表（或者按照 sort_order 最小的表）作为主表根表
        TableMeta root = tables.get(0);
        root.setQueryType("MAIN");
        meta.setMainTable(root);
        meta.getListTables().add(root); // 主表同时作为 LIST 表

        // 2. 识别哪些表是 Junction Table（中间表）
        // 规则：如果在 2 条及以上的 relation 里，该表都是“多（Many）”侧，它就是中间表
        Set<String> junctionTableNames = new HashSet<>();
        for (TableMeta table : tables) {
            if (table.getTableName().equals(root.getTableName())) continue;
            if (isJunctionTable(table, allRelations)) {
                junctionTableNames.add(table.getTableName());
            }
        }

        // 3. 遍历其他表，识别其角色 (SUB / JOIN / RELATION)
        for (TableMeta table : tables) {
            String tName = table.getTableName();
            if (tName.equals(root.getTableName())) {
                continue;
            }

            // 中间表不用作为普通的子表、JOIN表出现在 module_meta 的主干表属性里
            if (junctionTableNames.contains(tName)) {
                continue;
            }

            // 寻找当前表与主表（或已装配表）之间的直接关系
            RelationMeta rel = findRelationBetween(allRelations, root, table);
            if (rel == null) {
                // 如果没有直接关系，那它可能是多对多关联里的右表
                boolean isRightTableOfNM = allRelations.stream().anyMatch(r -> {
                    TableMeta junction = getTableByFieldId(tables, r.getTargetFieldId());
                    if (junction != null && junctionTableNames.contains(junction.getTableName())) {
                        TableMeta left = getTableByFieldId(tables, r.getSourceFieldId());
                        TableMeta right = getAnotherTargetOfJunction(tables, allRelations, junction, left);
                        return right != null && right.getTableName().equals(tName);
                    }
                    return false;
                });
                if (isRightTableOfNM) {
                    table.setQueryType("RELATION");
                    meta.getRelationTables().add(table);
                }
                continue;
            }

            // 存在直接关系，推导其基数类型
            boolean isSource = isFieldOfTable(root, rel.getSourceFieldId());
            NestType nestType = resolveNestType(rel, isSource);

            if (nestType == NestType.ARRAY) {
                // 嵌套为数组 → 一对多 → 从表 (SUB)
                table.setQueryType("SUB");
                
                // 填充从表需要的外键和主键关联列
                FieldMeta subFkField = getFieldById(tables, isSource ? rel.getTargetFieldId() : rel.getSourceFieldId());
                FieldMeta mainPkField = getFieldById(tables, isSource ? rel.getSourceFieldId() : rel.getTargetFieldId());
                table.setForeignKey(subFkField.getColumnName());
                table.setParentKey(mainPkField.getColumnName());
                
                meta.getSubTables().add(table);
            } else {
                // 嵌套为对象 → 多对一或一对一 → 关联表 (JOIN)
                table.setQueryType("JOIN");
                table.setJoinType("LEFT");
                
                FieldMeta joinFkField = getFieldById(tables, isSource ? rel.getTargetFieldId() : rel.getSourceFieldId());
                FieldMeta mainPkField = getFieldById(tables, isSource ? rel.getSourceFieldId() : rel.getTargetFieldId());
                // joinOn 格式，例如: "customer_profiles.name = orders.customer"
                table.setJoinOn(table.getTableName() + "." + joinFkField.getColumnName() + " = " + root.getTableName() + "." + mainPkField.getColumnName());
                
                meta.getJoinTables().add(table);
            }
        }

        // 4. 组装并填充多对多 Relations 中的中间表属性
        List<RelationMeta> nmRelations = new ArrayList<>();
        for (RelationMeta rel : allRelations) {
            TableMeta sourceTable = getTableByFieldId(tables, rel.getSourceFieldId());
            TableMeta targetTable = getTableByFieldId(tables, rel.getTargetFieldId());
            
            if (sourceTable == null || targetTable == null) continue;

            // 检查 targetTable 是否为 Junction Table
            if (junctionTableNames.contains(targetTable.getTableName())) {
                // 这是多对多关系的左半段
                TableMeta rightTable = getAnotherTargetOfJunction(tables, allRelations, targetTable, sourceTable);
                if (rightTable != null) {
                    rel.setJunctionTable(targetTable.getTableName());
                    rel.setLeftTable(sourceTable.getTableName());
                    rel.setRightTable(rightTable.getTableName());
                    
                    FieldMeta leftFkField = getFieldById(tables, rel.getTargetFieldId());
                    rel.setLeftFk(leftFkField.getColumnName());
                    
                    FieldMeta leftJoinField = getFieldById(tables, rel.getSourceFieldId());
                    rel.setLeftJoinColumn(leftJoinField.getColumnName());

                    // 寻找右半段关系
                    RelationMeta rightRel = findRelationBetween(allRelations, targetTable, rightTable);
                    if (rightRel != null) {
                        boolean isRightSource = isFieldOfTable(targetTable, rightRel.getSourceFieldId());
                        FieldMeta rightFkField = getFieldById(tables, isRightSource ? rightRel.getSourceFieldId() : rightRel.getTargetFieldId());
                        rel.setRightFk(rightFkField.getColumnName());
                        
                        FieldMeta rightJoinField = getFieldById(tables, isRightSource ? rightRel.getTargetFieldId() : rightRel.getSourceFieldId());
                        rel.setRightJoinColumn(rightJoinField.getColumnName());
                    }
                    nmRelations.add(rel);
                }
            }
        }
        meta.setRelations(nmRelations);
    }

    /**
     * 判断一个表是否为中间表
     */
    private boolean isJunctionTable(TableMeta table, List<RelationMeta> allRelations) {
        long manySideCount = allRelations.stream()
            .filter(r -> isManySideOnThisTable(r, table))
            .count();
        return allRelations.size() >= 2 && manySideCount >= 2;
    }

    /**
     * 判断某个关系的 "多" 侧是否落在指定表上
     */
    private boolean isManySideOnThisTable(RelationMeta rel, TableMeta table) {
        boolean isSource = isFieldOfTable(table, rel.getSourceFieldId());
        boolean isTarget = isFieldOfTable(table, rel.getTargetFieldId());
        if (!isSource && !isTarget) return false;
        
        NestType nestType = resolveNestType(rel, isSource);
        return nestType == NestType.OBJECT; // OBJECT 代表对端是一，所以当前表是多（Many）
    }

    private NestType resolveNestType(RelationMeta rel, boolean queryingFromSource) {
        String type = rel.getRelationType();
        if (RelationType.ONE_TO_ONE.getSymbol().equals(type)) return NestType.OBJECT;
        
        boolean targetIsOne;
        if (queryingFromSource) {
            targetIsOne = RelationType.MANY_TO_ONE.getSymbol().equals(type);
        } else {
            targetIsOne = RelationType.ONE_TO_MANY.getSymbol().equals(type);
        }
        return targetIsOne ? NestType.OBJECT : NestType.ARRAY;
    }

    private boolean isFieldOfTable(TableMeta table, Long fieldId) {
        return table.getFields().stream().anyMatch(f -> f.getId().equals(fieldId));
    }

    private TableMeta getTableByFieldId(List<TableMeta> tables, Long fieldId) {
        for (TableMeta t : tables) {
            if (isFieldOfTable(t, fieldId)) return t;
        }
        return null;
    }

    private FieldMeta getFieldById(List<TableMeta> tables, Long fieldId) {
        for (TableMeta t : tables) {
            for (FieldMeta f : t.getFields()) {
                if (f.getId().equals(fieldId)) return f;
            }
        }
        return null;
    }

    private RelationMeta findRelationBetween(List<RelationMeta> allRelations, TableMeta t1, TableMeta t2) {
        for (RelationMeta r : allRelations) {
            boolean hasT1 = isFieldOfTable(t1, r.getSourceFieldId()) || isFieldOfTable(t1, r.getTargetFieldId());
            boolean hasT2 = isFieldOfTable(t2, r.getSourceFieldId()) || isFieldOfTable(t2, r.getTargetFieldId());
            if (hasT1 && hasT2) return r;
        }
        return null;
    }

    private TableMeta getAnotherTargetOfJunction(List<TableMeta> tables, List<RelationMeta> allRelations, TableMeta junction, TableMeta left) {
        for (RelationMeta r : allRelations) {
            boolean hasJunction = isFieldOfTable(junction, r.getSourceFieldId()) || isFieldOfTable(junction, r.getTargetFieldId());
            if (hasJunction) {
                TableMeta other = getTableByFieldId(tables, isFieldOfTable(junction, r.getSourceFieldId()) ? r.getTargetFieldId() : r.getSourceFieldId());
                if (other != null && !other.getTableName().equals(left.getTableName()) && !other.getTableName().equals(junction.getTableName())) {
                    return other;
                }
            }
        }
        return null;
    }

    public enum NestType {
        OBJECT, ARRAY
    }
}
