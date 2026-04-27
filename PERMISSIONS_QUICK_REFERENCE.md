# Permissions System - Quick Reference

## Key Concepts

### Permission Node Format
```
{entity}.{fieldName}.{operationType}

Examples:
- hr_employee_base.emp_no.SELECT
- hr_payroll_result.net_amount.SELECT
- hr_employee_base.first_name.UPDATE
```

### Default Behavior
- **Whitelist/Deny-by-Default**: No fields accessible unless explicitly permitted
- **Empty Permissions**: Denies all field access
- **Persistence**: Permissions stored in `sys_permission_config` table

---

## API Quick Reference

### 1. Set Permissions
```bash
POST /api/permissions/config
Content-Type: application/json

{
  "permissions": [
    "hr_employee_base.emp_no.SELECT",
    "hr_employee_base.first_name.SELECT",
    "hr_payroll_result.net_amount.SELECT"
  ]
}
```

### 2. Get Current Permissions
```bash
GET /api/permissions/config
```

### 3. Check Single Permission
```bash
GET /api/permissions/check?entity=hr_employee_base&fieldName=emp_no&operationType=SELECT
```

### 4. Clear All Permissions
```bash
POST /api/permissions/clear
```

### 5. Execute Query with Permissions
```bash
GET /api/query/MOD-HR-EMP
# Only returns fields with SELECT permission
```

---

## Common Workflows

### Scenario 1: Allow All Fields for a Module
```bash
# Get module config to see all fields
curl http://localhost:3000/api/modules/MOD-HR-EMP

# Extract all physical fields and create permission nodes
# Then set permissions for all fields
curl -X POST http://localhost:3000/api/permissions/config \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": [
      "hr_employee_base.emp_no.SELECT",
      "hr_employee_base.first_name.SELECT",
      "hr_employee_base.last_name.SELECT",
      "hr_emp_job.emp_type.SELECT",
      "hr_organization.org_name.SELECT",
      "hr_employee_base.status.SELECT"
    ]
  }'
```

### Scenario 2: Restrict Sensitive Fields
```bash
# Allow all fields except sensitive ones
curl -X POST http://localhost:3000/api/permissions/config \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": [
      "hr_employee_base.emp_no.SELECT",
      "hr_employee_base.first_name.SELECT",
      "hr_employee_base.last_name.SELECT",
      "hr_emp_job.emp_type.SELECT",
      "hr_organization.org_name.SELECT"
      // Note: hr_emp_personal.id_card_no NOT included
    ]
  }'
```

### Scenario 3: Deny All Access
```bash
curl -X POST http://localhost:3000/api/permissions/clear
# or
curl -X POST http://localhost:3000/api/permissions/config \
  -H "Content-Type: application/json" \
  -d '{"permissions": []}'
```

---

## Query Execution Flow

```
GET /api/query/MOD-HR-EMP
    ↓
[权限拦截] Load global permissions from cache
    ↓
Check: Is permission set empty?
    ├─ YES → Return error "权限集合为空，无权访问任何字段"
    └─ NO → Continue
    ↓
Filter mappings: Keep only fields with SELECT permission
    ↓
Check: Are there any permitted fields?
    ├─ NO → Return error "无权访问该模块的任何字段"
    └─ YES → Continue
    ↓
Execute query with permitted fields only
    ↓
Return filtered results
```

---

## Database Schema

### sys_permission_config Table
```sql
CREATE TABLE sys_permission_config (
  id INTEGER PRIMARY KEY,
  permission_node VARCHAR UNIQUE,      -- "hr_employee_base.emp_no.SELECT"
  entity VARCHAR,                      -- "hr_employee_base"
  field_name VARCHAR,                  -- "emp_no"
  operation_type VARCHAR,              -- "SELECT", "UPDATE", "WRITE"
  description VARCHAR,                 -- Optional
  enabled BOOLEAN DEFAULT true,        -- Enable/disable
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Performance Notes

- **In-Memory Cache**: O(1) permission lookups
- **Database Persistence**: Survives application restarts
- **Async Loading**: Non-blocking initialization
- **Lazy Evaluation**: Permissions checked only during query execution

---

## Troubleshooting

### Issue: Query returns empty results
**Check**:
1. Are permissions configured? `GET /api/permissions/config`
2. Do permissions include the required fields?
3. Is the permission node format correct?

### Issue: "权限集合为空，无权访问任何字段"
**Solution**: Set permissions using `POST /api/permissions/config`

### Issue: "无权访问该模块的任何字段"
**Solution**: Add SELECT permissions for at least one field in the module

### Issue: Permissions not persisting after restart
**Check**:
1. Is `sys_permission_config` table created?
2. Are permissions being saved to database?
3. Check application logs for initialization errors

---

## Integration with Vue Frontend

The Vue frontend (`ModulePermissions.vue`) provides a UI for:
1. Viewing all physical fields in a module
2. Toggling SELECT/UPDATE/WRITE permissions
3. Saving configuration to backend
4. Clearing all permissions

Permission nodes are automatically generated from:
- Entity name (table name)
- Field name
- Operation type (SELECT, UPDATE, WRITE)

