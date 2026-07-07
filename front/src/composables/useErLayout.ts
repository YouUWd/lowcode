/**
 * useErLayout — Dagre 自动布局 Composable
 *
 * 使用 @dagrejs/dagre 对 Vue Flow 节点执行 LR 方向的层次布局。
 * 节点高度根据字段数量动态计算，确保表卡片之间不重叠。
 */
import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@vue-flow/core'

// 与 TableNode.vue 保持一致的尺寸常量
export const NODE_W    = 270  // 节点宽度
export const HEADER_H  = 40   // 表头高度
export const FIELD_H   = 30   // 单个字段行高度

/** 计算节点实际高度（header + 字段行数 × 行高） */
export function calcNodeHeight(node: Node): number {
  const fieldCount = node.data?.table?.fields?.length ?? 0
  return HEADER_H + fieldCount * FIELD_H
}

export interface DagreOptions {
  rankdir?: 'LR' | 'RL' | 'TB' | 'BT'
  nodesep?: number
  ranksep?: number
  marginx?: number
  marginy?: number
}

/**
 * 对传入的 nodes 执行 Dagre 布局，返回带 position 的新 nodes 数组。
 * edges 仅用于计算图拓扑关系，本身不会被修改。
 *
 * @param nodes      Vue Flow 节点列表
 * @param edges      Vue Flow 边列表（用于计算依赖关系）
 * @param options    Dagre 布局参数（默认 LR，水平展开）
 */
export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: DagreOptions = {},
): Node[] {
  if (!nodes.length) return nodes

  const {
    rankdir = 'LR',
    nodesep = 80,
    ranksep = 160,
    marginx = 60,
    marginy = 60,
  } = options

  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir, nodesep, ranksep, marginx, marginy })
  g.setDefaultEdgeLabel(() => ({}))

  // 注册节点尺寸
  nodes.forEach(node => {
    g.setNode(node.id, {
      width:  NODE_W,
      height: calcNodeHeight(node),
    })
  })

  // 注册边（仅影响排版，不绘制）
  edges.forEach(edge => {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  })

  dagre.layout(g)

  // 将 Dagre 的中心坐标转换为 Vue Flow 的左上角坐标
  return nodes.map(node => {
    const pos = g.node(node.id)
    if (!pos) return node
    return {
      ...node,
      position: {
        x: pos.x - pos.width  / 2,
        y: pos.y - pos.height / 2,
      },
    }
  })
}

/**
 * 增量布局：仅对坐标为 (0,0) 的新节点重新排版，
 * 保留用户已手动拖拽过的节点位置。
 */
export function applyIncrementalLayout(
  nodes: Node[],
  edges: Edge[],
  options: DagreOptions = {},
): Node[] {
  // 找出尚未手动定位的节点（position = {0,0}）
  const unpositioned = nodes.filter(
    n => n.position.x === 0 && n.position.y === 0
  )
  if (!unpositioned.length) return nodes

  // 只对未定位节点做 Dagre（整图拓扑但只更新未定位节点坐标）
  const laid = applyDagreLayout(nodes, edges, options)

  // 将已手动定位的节点坐标回填，只保留新节点的 Dagre 坐标
  return nodes.map(node => {
    const isNew = node.position.x === 0 && node.position.y === 0
    if (!isNew) return node
    return laid.find(n => n.id === node.id) ?? node
  })
}
