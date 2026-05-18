# Lumina 审批流引擎 v2.0 架构设计文档 (Workflow Engine v2.0)

## 一、 重构背景与终极目标

在 Lumina PHP 遗留系统中，审批流引擎与业务数据高度耦合（业务表强依赖 `status_group`、引擎直接修改业务库），导致系统极难维护且无法扩展新业务。

**v2.0 终极目标：100% 盲视解耦 (Zero-Intrusion Decoupling)**
在 NestJS + Knex 技术栈下，构建一个基于 **CQRS (命令查询职责分离)** 思想的统一工作流引擎。
*   **业务表绝对纯净**：真实的业务表（如 `score`, `depart_manage`）中**不包含任何工作流相关字段**（没有 status，没有 process_instance_id），只存储已经正式生效的数据。
*   **统一载荷管理**：所有业务的新增、修改“草稿意图”，在审批通过前，统统作为 JSON 存放在引擎的统一实例表中。
*   **事件驱动闭环**：引擎绝不越权操作业务表，流程完结时仅负责抛出标准事件，由业务侧订阅并执行最终的数据库级落地。

---

## 二、 核心架构理念

### 1. 统一流程载体 (Universal Workflow Payload)
引擎引入一张全局的 `sys_approval_instance` 表。无论何种业务申请，引擎只认 `module_id` 和打包好的 `payload` (JSON格式的变更明细)。这彻底消灭了为每个审批业务创建“中间草稿表”的冗余设计。

### 2. 单一链表与分叉树并发 (Linear List + Fork-Join)
废除跨模块拉起“子审批链”的复杂设计，所有协同审批收敛在一条宏观的双向链表中。
当遇到协同场景时，配置 **`parallel_group`（并行组）**。
*   **Fork (分支)**：到达该节点时，引擎为多个协办部门同时生成平级的子任务。
*   **Join (汇聚)**：引擎监听组内任务，当且仅当组内所有分支皆为 `PASS` 时，主指针才会推进到 `next_id`。

### 3. 靶向回退与容错 (Targeted Rollback)
允许业务在审批中途发生数据变更。
业务端抛出 `business.data.changed` 事件，引擎监听到后，根据配置的 `re_approval_strategy`，**精准作废 (INVALIDATED)** 涉事节点（如：仅重置分叉树中的财务节点），将指针局部倒回，而不干扰已通过的无关节点。

---

## 三、 数据库表结构设计 (Knex Schema)

四张核心表构成了引擎的独立宇宙，业务系统对其仅保持单向引用或完全通过事件交互。

### 1. 模板定义表 `sys_approval_chain_config`
负责定义审批流的路径和规则（蓝图）。

| 字段名 | 类型 | 核心作用与业务声明 |
| :--- | :--- | :--- |
| `id` | INT (PK) | 节点配置 ID |
| `module_id` | VARCHAR | 绑定业务模块 (对应 `sys_module.module_id`) |
| `up_id` | INT | 指向前驱节点 ID（首节点为 0） |
| `next_id` | INT | 指向后继节点 ID（尾节点为 0，代表同意即全剧终） |
| `node_name` | VARCHAR | 节点显示名称 (如：直属主管审批) |
| `node_type` | ENUM | **核心**：`user_task` (普通单任务) 或 `parallel_group` (并行组) |
| `approval_rule` | VARCHAR | `0`(指定), `1`(或签), `2`(全签), `3`(会签比例) |
| `parallel_branches`| JSON | `parallel_group` 生效时：定义并发任务 `[{branch_id, name, role_target}]` |
| `re_approval_strategy`| VARCHAR | `strict_reset`(强制回退), `smart_rollback`(靶向回退) |

### 2. 统一流程实例表 `sys_approval_instance`
**【终极解耦核心】** 承载所有业务的草稿与宏观状态。

| 字段名 | 类型 | 核心作用与业务声明 |
| :--- | :--- | :--- |
| `business_no` | VARCHAR (PK)| 统一流水号 (如 `REQ-2026-001`，跨越业务与引擎的唯一凭证) |
| `module_id` | VARCHAR | 绑定的业务模块ID |
| `target_entity` | VARCHAR | 要操作的具体物理表名 (可选，仅提供上下文，引擎不直接操作) |
| `target_record_id`| VARCHAR | 要修改的真实业务主键 (新增草稿时为空) |
| `action_type` | ENUM | 业务意图：`INSERT`, `UPDATE`, `DELETE`, `CUSTOM` |
| `reason` | VARCHAR | 申请事由/备注说明 (与实际业务数据隔离，单独处理) |
| `payload` | JSON | **暂存的纯净业务草稿数据/变更明细** (在流程结束前，真实业务表不受影响) |
| `macro_status` | INT | 宏观状态: `1`(审批中), `99`(生效), `-99`(作废) |

### 3. 运行微观任务表 `sys_approval_task`
记录引擎当前卡在什么节点，谁需要审批。

| 字段名 | 类型 | 核心作用与业务声明 |
| :--- | :--- | :--- |
| `id` | INT (PK) | 任务 ID |
| `business_no` | VARCHAR | 关联实例表的流水号 |
| `node_id` | INT | 关联 `config` 表的具体节点 |
| `branch_id` | VARCHAR | 若为并联任务，记录所属的 `branch_id`；普通任务为空 |
| `status` | ENUM | `PENDING`(待处理), `PASS`(通过), `REJECT`(驳回), `INVALIDATED`(被靶向回退作废) |

### 4. 流转审计日志表 `sys_approval_log`
纯粹的不可变数据，用于追踪轨迹。包含 `is_system` 标识系统自动介入的动作（如数据变更触发的重审记录）。

---

## 四、 核心业务生命周期契约 (Lifecycle & Events)

业务端与引擎端通过 `@nestjs/event-emitter` 实现绝对的边界隔离。

### 阶段 1：业务发起草稿 (Start Process)
业务线（如人事部）在前端提交了一份《修改部门负责人》表单。
1. 业务模块**不操作数据库**，将表单数据封装。
2. 业务模块调用引擎发起接口，将草稿作为 `payload` 移交引擎。
```typescript
WorkflowEngine.startProcess({
  moduleId: 'MOD-DEPART',
  targetEntity: 'depart_manage',
  targetRecordId: 102,
  actionType: 'UPDATE',
  payload: { manager_id: 88, reason: "正常人事调动" }, // 暂存在引擎
  submitterId: 'U123'
});
```
*   **引擎响应**：生成实例（`macro_status=1`），指针放在 `up_id=0` 的节点，生成相应的 Task。

### 阶段 2：中途查询组装 (In-Memory DTO Join)
前端请求“部门列表”及“在途变更申请”时：
1. 业务系统查询真实库 `depart_manage`。
2. 业务系统通过通用模块向引擎拉取与当前用户相关的 `sys_approval_instance` 视图。
3. NestJS 在内存中将（真实数据 + 引擎中正在流转的 Payload 草稿 + 当前卡点的节点名称）合并成 DTO 返回前端渲染。

### 阶段 3：草稿数据中途变更触发回退 (Data Modification Trigger)
如果申请人在审批途中修改了申请表单内容（即修改了 Payload）：
1. 业务系统向引擎请求更新 Payload。
2. 引擎自身抛出 `workflow.data.changed` 内部事件。
3. 引擎根据 `re_approval_strategy`，若判定触发回退，则将涉事节点任务状态设为 `INVALIDATED`，将双向链表指针 `current_node_idx` 倒回，并写一条 `is_system=true` 的警告日志。

### 阶段 4：流程终审完毕 (Final Approval Event)
当流程走到尾节点并 `PASS`，引擎判定 `next_id === 0`。
1. 引擎更新 `sys_approval_instance.macro_status = 99`。
2. **【核心契约】引擎绝不越权操作真实的 `depart_manage` 数据库表。**
3. 引擎向系统总线大喊一声：
```typescript
this.eventEmitter.emit('workflow.process.approved.MOD-DEPART', { 
  businessNo: 'REQ-2026-001',
  targetEntity: 'depart_manage',
  targetRecordId: 102,
  actionType: 'UPDATE',
  payload: { manager_id: 88, reason: "正常人事调动" } // 携带最终确认过的纯净数据
});
```
4. 业务侧对应的 `DepartManageService` 监听到该事件，收到 `payload`，执行最终的实际业务逻辑（如 SQL UPDATE、发送恭喜邮件、调用外部财务 API 等）。
5. 流程完美闭环。