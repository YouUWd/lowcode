<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({
  data: { type: Object, required: true },
  type: { type: String, default: '' },
})

// 平滑映射大写状态到小写 CSS 类名
const statusClass = computed(() => {
  const rawStatus = (props.data.status || 'PENDING').toLowerCase();
  const mapping = {
    passed: 'completed',
    active: 'processing',
    invalidated: 'rejected',
    pending: 'pending'
  };
  return mapping[rawStatus] || rawStatus;
})

// 动态映射图标名称
const iconName = computed(() => {
  switch (props.data.kind) {
    case 'start': return 'play_arrow';
    case 'end': return 'flag';
    case 'gateway': return 'alt_route';
    default: return 'shield_person';
  }
})

// 动态映射标题名称
const titleText = computed(() => {
  switch (props.data.kind) {
    case 'start': return '流程开始';
    case 'end': return '流程结束';
    case 'gateway': return '并联网关';
    default: return props.data.label || '审批节点';
  }
})

// 动态映射副标题/角色名称
const subtitleText = computed(() => {
  switch (props.data.kind) {
    case 'start': return '申请人发起';
    case 'end': return '归档并生效';
    case 'gateway': return '分流/汇聚';
    default: return props.data.code || 'SYS_ROLE';
  }
})
</script>

<template>
  <div :class="['node-container', statusClass, data.kind]">
    <!-- 左侧输入连接点：除起点节点外，一概渲染 -->
    <Handle v-if="data.kind !== 'start'" id="in-main" type="target" :position="Position.Left" class="custom-handle" />

    <!-- 100% 统一规格的卡片结构主体 -->
    <div class="card-body animate-fade">
      <!-- 左侧：图标容器 -->
      <div class="icon-wrapper">
        <span class="material-symbols-outlined node-icon">{{ iconName }}</span>
      </div>

      <!-- 右侧：文字说明仓 -->
      <div class="info-wrapper">
        <div class="node-title" :title="titleText">{{ titleText }}</div>
        <div class="node-subtitle" :title="subtitleText">{{ subtitleText }}</div>
      </div>
    </div>

    <!-- 网关节点的特殊分支接线锚点 -->
    <template v-if="data.kind === 'gateway'">
      <Handle id="out-top" type="source" :position="Position.Top" class="custom-handle" />
      <Handle id="out-bottom" type="source" :position="Position.Bottom" class="custom-handle" />
      <Handle id="in-top" type="target" :position="Position.Top" class="custom-handle" />
      <Handle id="in-bottom" type="target" :position="Position.Bottom" class="custom-handle" />
    </template>

    <!-- 右侧输出连接点：除终点节点外，一概渲染 -->
    <Handle v-if="data.kind !== 'end'" id="out-main" type="source" :position="Position.Right" class="custom-handle" />
  </div>
</template>

<style scoped>
/* ============ 统一卡片规格布局 (150px × 60px) ============ */
.node-container {
  width: 150px;
  height: 60px;
  border-radius: 12px;
  background: #ffffff;
  border: 1.5px solid var(--status-color);
  box-shadow: 0 4px 12px rgba(25, 28, 29, 0.03);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible; /* 允许 Handles 显示在边界外 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.node-container:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* ============ 状态颜色及渐变定义 ============ */
.completed {
  --status-color: #10b981;
  --status-bg: #f0fdf4;
}
.processing {
  --status-color: #3b82f6;
  --status-bg: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
  animation: pulse-blue 2s infinite;
}
.pending {
  --status-color: #9ca3af;
  --status-bg: #f9fafb;
}
.rejected {
  --status-color: #ef4444;
  --status-bg: #fef2f2;
}

.rejected .icon-wrapper {
  background: #ffffff;
  border: 1.5px solid var(--status-color);
  color: var(--status-color);
}

/* ============ 卡片内部双栏结构 ============ */
.card-body {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 10px;
  border-radius: 10.5px;
  background: linear-gradient(135deg, #ffffff 60%, var(--status-bg));
  pointer-events: none; /* 防止内部元素干扰拖拽 */
}

/* 左侧图标外框 (精致倒角正方形) */
.icon-wrapper {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--status-color);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
  shrink-0: 1;
}

.node-icon {
  font-size: 16px !important;
  font-weight: bold;
}

/* 右侧文本排版 */
.info-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  flex: 1;
  min-width: 0;
}

.node-title {
  font-size: 11px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
  width: 86px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Manrope', 'PingFang SC', sans-serif;
  letter-spacing: -0.01em;
}

.node-subtitle {
  font-size: 9px;
  font-weight: 600;
  color: #64748b;
  width: 86px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'SF Mono', Consolas, monospace;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  margin-top: 1px;
}

/* ============ 精致锚点 Handles 句柄样式 ============ */
.custom-handle {
  width: 8px !important;
  height: 8px !important;
  background: var(--status-color) !important;
  border: 1.5px solid #ffffff !important;
  border-radius: 50% !important;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 20;
}

.node-container:hover .custom-handle {
  opacity: 1;
}

/* ============ 关键帧动画 ============ */
@keyframes pulse-blue {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.45);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

.animate-fade {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
