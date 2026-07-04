/** 权限位掩码工具：4 = 可读(READ)，2 = 新增写(WRITE)，1 = 修改(UPDATE) */

export const PERM_READ = 4
export const PERM_WRITE = 2
export const PERM_UPDATE = 1

export interface CheckboxStates {
  canRead: boolean
  canWrite: boolean
  canUpdate: boolean
}

/** 后端整型 perm 转换为三个 Checkbox 布尔状态 */
export function getCheckboxStates(perm: number): CheckboxStates {
  return {
    canRead: (perm & PERM_READ) === PERM_READ,
    canWrite: (perm & PERM_WRITE) === PERM_WRITE,
    canUpdate: (perm & PERM_UPDATE) === PERM_UPDATE,
  }
}

/** 三个 Checkbox 状态组合为整型 perm */
export function getPermValue(canRead: boolean, canWrite: boolean, canUpdate: boolean): number {
  let perm = 0
  if (canRead) perm |= PERM_READ
  if (canWrite) perm |= PERM_WRITE
  if (canUpdate) perm |= PERM_UPDATE
  return perm
}

export function canRead(perm: number): boolean {
  return (perm & PERM_READ) === PERM_READ
}
export function canWrite(perm: number): boolean {
  return (perm & PERM_WRITE) === PERM_WRITE
}
export function canUpdate(perm: number): boolean {
  return (perm & PERM_UPDATE) === PERM_UPDATE
}

export function permLabel(perm: number): string {
  if (perm === 0) return '无权限'
  const parts: string[] = []
  if (canRead(perm)) parts.push('读')
  if (canWrite(perm)) parts.push('增')
  if (canUpdate(perm)) parts.push('改')
  return parts.join(' / ')
}
