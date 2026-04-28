# Module Hierarchy Design Document

## Overview

This document outlines the design for implementing a parent-child hierarchical relationship in the `sys_module` table to support nested module organization.

## Problem Statement

Currently, modules are stored as flat records without any hierarchical relationship. The system needs to support:
- Organizing modules into parent-child relationships
- Supporting multiple nesting levels
- Efficient querying of module hierarchies
- Maintaining module permissions across hierarchy levels

## Design Approach: Self-Referencing Foreign Key

### Why This Approach?

**Selected Option:** Self-Referencing Foreign Key with Level Tracking

**Rationale:**
- Simple and normalized database design
- Supports unlimited nesting levels
- Standard hierarchical data pattern
- Easy to implement and maintain
- Efficient for most query patterns
- Compatible with existing permission system

**Alternatives Considered:**
- Materialized Path: Better for deep hierarchies but requires path maintenance
- Nested Set Model: Optimal for read-heavy workloads but complex to maintain
- Closure Table: Supports all operations efficiently but adds complexity

## Database Schema Changes

### Table Modification: sys_module

Add two new columns to support hierarchy:

```sql
ALTER TABLE sys_module ADD COLUMN parent_module_id VARCHAR(50) NULL;
ALTER TABLE sys_module ADD COLUMN level INT DEFAULT 0;
ALTER TABLE sys_module ADD FOREIGN KEY (parent_module_id) REFERENCES sys_module(module_id);
```

### Column Definitions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `parent_module_id` | VARCHAR(50) | YES | NULL | Reference to parent module's module_id |
| `level` | INT | NO | 0 | Hierarchy depth (0 = root, 1 = child, etc.) |

### Constraints

- `parent_module_id` references `sys_module.module_id` (self-referencing FK)
- `level` is auto-calculated based on parent's level
- Root modules have `parent_module_id = NULL` and `level = 0`

## Data Model Examples

### Hierarchy Structure

```
MOD-HR (level 0, parent_module_id = NULL)
├── MOD-HR-ORG (level 1, parent_module_id = 'MOD-HR')
│   └── MOD-HR-ORG-DETAIL (level 2, parent_module_id = 'MOD-HR-ORG')
├── MOD-HR-EMP (level 1, parent_module_id = 'MOD-HR')
└── MOD-HR-PAY (level 1, parent_module_id = 'MOD-HR')

MOD-SYS (level 0, parent_module_id = NULL)
└── MOD-SYS-LOG (level 1, parent_module_id = 'MOD-SYS')
```

### Sample Data

```typescript
// Root modules
{ module_id: 'MOD-HR', module_name: 'HR系统', parent_module_id: null, level: 0 }
{ module_id: 'MOD-SYS', module_name: '系统管理', parent_module_id: null, level: 0 }

// Child modules
{ module_id: 'MOD-HR-ORG', module_name: '组织架构管理', parent_module_id: 'MOD-HR', level: 1 }
{ module_id: 'MOD-HR-EMP', module_name: '员工核心档案', parent_module_id: 'MOD-HR', level: 1 }
{ module_id: 'MOD-HR-PAY', module_name: '薪酬核算中心', parent_module_id: 'MOD-HR', level: 1 }
{ module_id: 'MOD-SYS-LOG', module_name: '系统操作日志', parent_module_id: 'MOD-SYS', level: 1 }

// Grandchild modules
{ module_id: 'MOD-HR-ORG-DETAIL', module_name: '组织详情', parent_module_id: 'MOD-HR-ORG', level: 2 }
```

## API Design

### New Endpoints

#### 1. Get Module Tree (Hierarchical View)
```
GET /api/modules/tree
Response:
{
  "success": true,
  "modules": [
    {
      "module_id": "MOD-HR",
      "module_name": "HR系统",
      "level": 0,
      "parent_module_id": null,
      "children": [
        {
          "module_id": "MOD-HR-ORG",
          "module_name": "组织架构管理",
          "level": 1,
          "parent_module_id": "MOD-HR",
          "children": [...]
        }
      ]
    }
  ]
}
```

#### 2. Get Child Modules
```
GET /api/modules/:moduleId/children
Response:
{
  "success": true,
  "moduleId": "MOD-HR",
  "children": [
    { module_id: "MOD-HR-ORG", ... },
    { module_id: "MOD-HR-EMP", ... },
    { module_id: "MOD-HR-PAY", ... }
  ],
  "count": 3
}
```

#### 3. Get Parent Module
```
GET /api/modules/:moduleId/parent
Response:
{
  "success": true,
  "moduleId": "MOD-HR-ORG",
  "parent": {
    "module_id": "MOD-HR",
    "module_name": "HR系统",
    ...
  }
}
```

#### 4. Get Ancestor Path
```
GET /api/modules/:moduleId/ancestors
Response:
{
  "success": true,
  "moduleId": "MOD-HR-ORG-DETAIL",
  "ancestors": [
    { module_id: "MOD-HR-ORG-DETAIL", level: 2 },
    { module_id: "MOD-HR-ORG", level: 1 },
    { module_id: "MOD-HR", level: 0 }
  ]
}
```

#### 5. Create Child Module
```
POST /api/modules
Body:
{
  "module_id": "MOD-HR-ORG-DETAIL",
  "module_name": "组织详情",
  "parent_module_id": "MOD-HR-ORG",
  "primary_entity": "hr_organization_detail",
  ...
}
```

## Service Layer Design

### ModulesService Methods

```typescript
// Get module tree structure
async getModuleTree(): Promise<ModuleTreeNode[]>

// Get direct children of a module
async getChildModules(parentModuleId: string): Promise<Module[]>

// Get parent module
async getParentModule(moduleId: string): Promise<Module | null>

// Get all ancestors (breadcrumb path)
async getAncestorModules(moduleId: string): Promise<Module[]>

// Get all descendants (recursive)
async getDescendantModules(moduleId: string): Promise<Module[]>

// Create module with parent
async createModule(moduleData: CreateModuleDTO): Promise<Module>

// Update module parent
async updateModuleParent(moduleId: string, newParentId: string | null): Promise<void>

// Validate hierarchy (prevent cycles)
async validateHierarchy(moduleId: string, newParentId: string): Promise<boolean>
```

## Permission Inheritance Strategy

### Current State
- Permissions are module-scoped via `module_id` in `sys_permission_config`

### Proposed Enhancement

**Option A: Explicit Inheritance (Recommended)**
- Child modules inherit parent's permissions by default
- Child modules can override with additional permissions
- Query: Get all permissions for module + all ancestor permissions

**Option B: Independent Permissions**
- Each module has independent permissions
- No automatic inheritance
- Simpler to implement, requires explicit permission assignment

**Recommendation:** Option A with override capability
- More intuitive for users
- Reduces permission duplication
- Allows fine-grained control

## Implementation Phases

### Phase 1: Database Schema
- Add `parent_module_id` and `level` columns
- Create foreign key constraint
- Migrate existing data (all modules become root level)

### Phase 2: Service Layer
- Implement hierarchy query methods
- Add validation logic (prevent cycles)
- Update module creation/update logic

### Phase 3: API Endpoints
- Implement tree view endpoint
- Implement child/parent/ancestor endpoints
- Update existing endpoints to support hierarchy

### Phase 4: Permission Integration
- Implement permission inheritance logic
- Update permission filtering to consider hierarchy
- Add permission override capability

### Phase 5: UI/Frontend
- Display module tree in UI
- Support drag-and-drop hierarchy management
- Show permission inheritance in UI

## Validation Rules

### Hierarchy Validation

1. **No Circular References**
   - Cannot set a module as its own parent
   - Cannot create cycles (A → B → C → A)

2. **Level Consistency**
   - Child level = parent level + 1
   - Auto-update descendants when parent changes

3. **Parent Existence**
   - Parent module must exist and be active
   - Cannot set inactive module as parent

4. **Depth Limit** (Optional)
   - Maximum nesting depth (e.g., 5 levels)
   - Prevents performance issues

## Query Performance Considerations

### Indexes to Add

```sql
CREATE INDEX idx_sys_module_parent ON sys_module(parent_module_id);
CREATE INDEX idx_sys_module_level ON sys_module(level);
CREATE INDEX idx_sys_module_active_parent ON sys_module(is_active, parent_module_id);
```

### Query Optimization

- Use indexes for parent lookups
- Cache tree structure in memory (optional)
- Limit recursion depth for ancestor queries
- Use materialized path if deep hierarchies become common

## Migration Strategy

### For Existing Data

```typescript
// All existing modules become root level
UPDATE sys_module SET parent_module_id = NULL, level = 0;

// Then manually assign parent relationships as needed
UPDATE sys_module SET parent_module_id = 'MOD-HR', level = 1 
WHERE module_id IN ('MOD-HR-ORG', 'MOD-HR-EMP', 'MOD-HR-PAY');
```

## Error Handling

### Error Cases

| Error | HTTP Code | Message |
|-------|-----------|---------|
| Circular reference detected | 400 | Cannot set module as ancestor of itself |
| Parent not found | 404 | Parent module does not exist |
| Parent is inactive | 400 | Cannot set inactive module as parent |
| Max depth exceeded | 400 | Maximum hierarchy depth exceeded |
| Invalid parent module | 400 | Parent module is invalid |

## Testing Strategy

### Unit Tests
- Hierarchy validation logic
- Cycle detection
- Level calculation

### Integration Tests
- Create module with parent
- Update module parent
- Query tree structure
- Permission inheritance

### Performance Tests
- Tree query performance
- Ancestor query performance
- Large hierarchy handling

## Future Enhancements

1. **Materialized Path**: If deep hierarchies become common
2. **Module Versioning**: Track hierarchy changes over time
3. **Bulk Operations**: Move multiple modules at once
4. **Soft Deletes**: Archive modules while preserving hierarchy
5. **Module Templates**: Create module hierarchies from templates

## Rollback Plan

If issues arise:
1. Remove `parent_module_id` and `level` columns
2. Revert to flat module structure
3. No data loss (columns are additive)

## Success Criteria

- ✅ Modules can be organized in hierarchies
- ✅ Tree queries perform efficiently
- ✅ No circular references possible
- ✅ Permissions work correctly with hierarchy
- ✅ API endpoints support hierarchy operations
- ✅ Existing functionality remains unchanged
