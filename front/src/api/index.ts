import type { ModuleMeta, PermBatchRequest, PermTable, QueryRequest, Result } from '../types'

export class ApiError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<Result<T>> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  })
  
  let data: any
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch (e) {
      if (!res.ok) {
        throw new ApiError(res.status, res.statusText || '请求异常')
      }
      return { code: 200, message: 'success', data: null as any }
    }
  }

  if (data && typeof data === 'object' && 'code' in data) {
    if (data.code !== 200) {
      throw new ApiError(data.code, data.message || '请求异常')
    }
    return data
  }

  if (!res.ok) {
    throw new ApiError(res.status, data?.message || res.statusText || '请求异常')
  }

  return { code: 200, message: 'success', data }
}

/* ================= 一、模块设计 API ================= */

/** GET /api/module/{moduleId}/meta */
export async function fetchModuleMeta(moduleId: string): Promise<Result<ModuleMeta>> {
  return request<ModuleMeta>(`/api/module/${moduleId}/meta`)
}

/** POST /api/module/design */
export async function saveModuleDesign(design: ModuleMeta): Promise<Result<null>> {
  return request<null>('/api/module/design', {
    method: 'POST',
    body: JSON.stringify(design)
  })
}

/** POST /api/module/{moduleId}/refresh-cache */
export async function refreshModuleCache(moduleId: string): Promise<Result<null>> {
  return request<null>(`/api/module/${moduleId}/refresh-cache`, {
    method: 'POST'
  })
}

/* ================= 二、数据引擎 API ================= */

/** POST /api/module/{moduleId}/query */
export async function queryModuleData(
  moduleId: string,
  role: string,
  req: QueryRequest,
): Promise<Result<unknown>> {
  return request<unknown>(`/api/module/${moduleId}/query`, {
    method: 'POST',
    headers: {
      'X-Role': role
    },
    body: JSON.stringify(req)
  })
}

/** POST /api/module/{moduleId}/save */
export async function saveModuleData(
  moduleId: string,
  role: string,
  payload: { data: Record<string, unknown> },
): Promise<Result<number>> {
  return request<number>(`/api/module/${moduleId}/save`, {
    method: 'POST',
    headers: {
      'X-Role': role
    },
    body: JSON.stringify(payload)
  })
}

/** DELETE /api/module/{moduleId}/{id} */
export async function deleteModuleData(moduleId: string, id: number): Promise<Result<null>> {
  return request<null>(`/api/module/${moduleId}/${id}`, {
    method: 'DELETE'
  })
}

/* ================= 三、权限配置 API ================= */

/** GET /api/admin/permission/{moduleId}/{roleCode} */
export async function fetchRolePermissions(
  moduleId: string,
  roleCode: string,
): Promise<Result<PermTable[]>> {
  return request<PermTable[]>(`/api/admin/permission/${moduleId}/${roleCode}`)
}

/** POST /api/admin/permission/field/batch */
export async function savePermissionBatch(req: PermBatchRequest): Promise<Result<boolean>> {
  return request<boolean>('/api/admin/permission/field/batch', {
    method: 'POST',
    body: JSON.stringify(req)
  })
}

/* ================= 四、全局拓扑元数据 API ================= */

/** GET /api/meta/schema — 加载全量 Schema 拓扑 */
export async function fetchMetaSchema(): Promise<Result<any>> {
  return request<any>('/api/meta/schema')
}

/** POST /api/meta/schema — 声明式差异同步保存全量 Schema */
export async function saveMetaSchema(payload: any): Promise<Result<any>> {
  return request<any>('/api/meta/schema', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
