# Lumina 动态查询引擎 - API 设计文档

## 1. API 概述

### 1.1 基础信息

- **基础 URL**: `http://localhost:8080/api`
- **API 版本**: v1
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON
- **字符编码**: UTF-8

### 1.2 通用响应格式

**成功响应**:
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "errorCode": "ERROR_CODE",
  "errorMessage": "错误描述",
  "timestamp": "2024-01-15T10:30:00"
}
```

### 1.3 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

## 2. 查询接口

### 2.1 执行动态查询

**端点**: `POST /api/query/{moduleId}`

**描述**: 根据模块配置执行动态查询

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| moduleId | string | 是 | 模块ID，如 MOD-STUDENT-FULL |

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页大小，默认 20 |
| sortBy | string | 否 | 排序字段 |
| sortOrder | string | 否 | 排序顺序：asc/desc |

**请求体**:
```json
{
  "page": 1,
  "pageSize": 20
}
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "studentNo": "2024001",
      "fullName": "张伟",
      "genderText": "男",
      "birthDate": "2008年03月15日",
      "age": 16,
      "className": "高一(1)班",
      "gradeLevel": "高一",
      "scores": [
        {
          "semester": "2024-1",
          "scoreValue": 95.5,
          "scoreGrade": "A",
          "scoreDisplay": "95.5分 (A)",
          "examDate": "2024-11-15"
        }
      ]
    }
  ],
  "count": 10,
  "message": "查询成功"
}
```

**错误示例**:
```json
{
  "success": false,
  "errorCode": "MODULE_NOT_FOUND",
  "errorMessage": "模块 MOD-STUDENT-FULL 不存在",
  "timestamp": "2024-01-15T10:30:00"
}
```

**cURL 示例**:
```bash
curl -X POST http://localhost:8080/api/query/MOD-STUDENT-FULL \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "pageSize": 20
  }'
```

## 3. 模块管理接口

### 3.1 获取模块列表

**端点**: `GET /api/modules`

**描述**: 获取所有可用模块

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "MOD-STUDENT-FULL",
      "moduleName": "学生完整信息",
      "moduleDesc": "学生完整信息 - 混合 1:1、1:N、N:1 关联",
      "primaryEntity": "student",
      "recordCount": 10,
      "status": "active"
    }
  ],
  "message": "获取成功"
}
```

### 3.2 获取模块详情

**端点**: `GET /api/modules/{moduleId}`

**描述**: 获取指定模块的详细配置

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| moduleId | string | 是 | 模块ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "MOD-STUDENT-FULL",
    "moduleName": "学生完整信息",
    "moduleDesc": "学生完整信息 - 混合 1:1、1:N、N:1 关联",
    "primaryEntity": {
      "name": "student",
      "desc": "学生主表"
    },
    "entities": [
      {
        "id": "E001",
        "name": "class",
        "relationType": "N:1",
        "joinCondition": {
          "left": "id",
          "right": "class_id"
        }
      },
      {
        "id": "E002",
        "name": "score",
        "relationType": "1:N",
        "joinCondition": {
          "left": "student_id",
          "right": "id"
        }
      }
    ],
    "mappings": [
      {
        "displayName": "学号",
        "logicalField": "studentNo",
        "physicalFields": [
          {
            "entity": "student",
            "name": "student_no"
          }
        ],
        "transformer": null,
        "transformerEnv": "none"
      }
    ]
  },
  "message": "获取成功"
}
```

### 3.3 创建模块

**端点**: `POST /api/modules`

**描述**: 创建新模块

**权限**: 需要 ADMIN 角色

**请求体**:
```json
{
  "id": "MOD-NEW-MODULE",
  "moduleName": "新模块",
  "moduleDesc": "新模块描述",
  "primaryEntity": {
    "name": "student",
    "desc": "学生主表"
  },
  "entities": [],
  "mappings": []
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "MOD-NEW-MODULE"
  },
  "message": "创建成功"
}
```

### 3.4 更新模块

**端点**: `PUT /api/modules/{moduleId}`

**描述**: 更新模块配置

**权限**: 需要 ADMIN 角色

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| moduleId | string | 是 | 模块ID |

**请求体**: 同创建模块

**响应示例**:
```json
{
  "success": true,
  "message": "更新成功"
}
```

### 3.5 删除模块

**端点**: `DELETE /api/modules/{moduleId}`

**描述**: 删除模块

**权限**: 需要 ADMIN 角色

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| moduleId | string | 是 | 模块ID |

**响应示例**:
```json
{
  "success": true,
  "message": "删除成功"
}
```

## 4. 权限管理接口

### 4.1 获取模块权限

**端点**: `GET /api/permissions/{moduleId}`

**描述**: 获取指定模块的权限配置

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| moduleId | string | 是 | 模块ID |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "permissionNode": "student.student_no.READ",
      "entity": "student",
      "fieldName": "student_no",
      "operationType": "READ",
      "logicalField": "studentNo",
      "enabled": true
    }
  ],
  "message": "获取成功"
}
```

### 4.2 设置模块权限

**端点**: `POST /api/permissions/{moduleId}`

**描述**: 设置模块权限

**权限**: 需要 ADMIN 角色

**路径参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| moduleId | string | 是 | 模块ID |

**请求体**:
```json
{
  "permissions": [
    {
      "permissionNode": "student.student_no.READ",
      "entity": "student",
      "fieldName": "student_no",
      "operationType": "READ",
      "enabled": true
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "权限设置成功"
}
```

## 5. 字典管理接口

### 5.1 获取字典列表

**端点**: `GET /api/dictionaries`

**描述**: 获取所有字典

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| dictCode | string | 否 | 字典编码 |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "dictCode": "GENDER",
      "dictName": "性别",
      "dictValue": "1",
      "dictLabel": "男",
      "sortOrder": 1
    },
    {
      "id": 2,
      "dictCode": "GENDER",
      "dictName": "性别",
      "dictValue": "2",
      "dictLabel": "女",
      "sortOrder": 2
    }
  ],
  "message": "获取成功"
}
```

### 5.2 创建字典

**端点**: `POST /api/dictionaries`

**描述**: 创建字典项

**权限**: 需要 ADMIN 角色

**请求体**:
```json
{
  "dictCode": "GENDER",
  "dictName": "性别",
  "dictValue": "1",
  "dictLabel": "男",
  "sortOrder": 1
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1
  },
  "message": "创建成功"
}
```

## 6. 认证接口

### 6.1 用户登录

**端点**: `POST /api/auth/login`

**描述**: 用户登录获取 JWT Token

**请求体**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "username": "admin",
      "roles": ["ADMIN"]
    }
  },
  "message": "登录成功"
}
```

### 6.2 刷新 Token

**端点**: `POST /api/auth/refresh`

**描述**: 刷新 JWT Token

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "message": "刷新成功"
}
```

### 6.3 用户登出

**端点**: `POST /api/auth/logout`

**描述**: 用户登出

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

## 7. 审计日志接口

### 7.1 获取审计日志

**端点**: `GET /api/audit-logs`

**描述**: 获取审计日志列表

**权限**: 需要 ADMIN 角色

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| moduleId | string | 否 | 模块ID |
| operationType | string | 否 | 操作类型 |
| startDate | string | 否 | 开始日期 (YYYY-MM-DD) |
| endDate | string | 否 | 结束日期 (YYYY-MM-DD) |
| page | integer | 否 | 页码 |
| pageSize | integer | 否 | 每页大小 |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "moduleId": "MOD-STUDENT-FULL",
      "operationType": "QUERY",
      "entityName": "student",
      "userId": "admin",
      "userName": "管理员",
      "ipAddress": "192.168.1.100",
      "executionTime": 125,
      "status": "SUCCESS",
      "createdAt": "2024-01-15T10:30:00"
    }
  ],
  "count": 100,
  "message": "获取成功"
}
```

## 8. 错误代码

| 错误代码 | HTTP 状态码 | 说明 |
|---------|-----------|------|
| MODULE_NOT_FOUND | 404 | 模块不存在 |
| FIELD_NOT_FOUND | 404 | 字段不存在 |
| PERMISSION_DENIED | 403 | 无权限访问 |
| INVALID_PARAMETER | 400 | 参数无效 |
| QUERY_ERROR | 400 | 查询错误 |
| AUTHENTICATION_FAILED | 401 | 认证失败 |
| TOKEN_EXPIRED | 401 | Token 已过期 |
| SYSTEM_ERROR | 500 | 系统错误 |

## 9. 速率限制

- **限制**: 每分钟 1000 个请求
- **响应头**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 10. 版本控制

- **当前版本**: v1
- **弃用版本**: 无
- **计划版本**: v2 (计划中)

## 11. 示例代码

### JavaScript/TypeScript

```javascript
// 查询学生信息
async function queryStudents() {
  const response = await fetch('http://localhost:8080/api/query/MOD-STUDENT-FULL', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      page: 1,
      pageSize: 20
    })
  });
  
  const result = await response.json();
  return result.data;
}
```

### Python

```python
import requests

# 查询学生信息
def query_students(token):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'page': 1,
        'pageSize': 20
    }
    
    response = requests.post(
        'http://localhost:8080/api/query/MOD-STUDENT-FULL',
        headers=headers,
        json=data
    )
    
    return response.json()['data']
```

### Java

```java
// 查询学生信息
public List<Map<String, Object>> queryStudents(String token) {
    RestTemplate restTemplate = new RestTemplate();
    
    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Bearer " + token);
    headers.setContentType(MediaType.APPLICATION_JSON);
    
    QueryOptions options = new QueryOptions();
    options.setPage(1);
    options.setPageSize(20);
    
    HttpEntity<QueryOptions> request = new HttpEntity<>(options, headers);
    
    ResponseEntity<QueryResult> response = restTemplate.postForEntity(
        "http://localhost:8080/api/query/MOD-STUDENT-FULL",
        request,
        QueryResult.class
    );
    
    return response.getBody().getData();
}
```

## 12. 总结

本 API 设计文档提供了完整的 RESTful API 规范，包括：

1. **查询接口**：动态查询数据
2. **模块管理**：CRUD 操作
3. **权限管理**：权限配置
4. **字典管理**：字典数据维护
5. **认证接口**：用户登录和 Token 管理
6. **审计日志**：操作日志查询

所有接口都遵循 RESTful 规范，使用 JSON 格式，支持 JWT 认证。
