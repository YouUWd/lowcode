# 审批与工作流引擎 需求与设计文档 (Approval & Workflow Engine Document)

## 一、 引言
本模块（Workflow Engine）承担着整个系统中极具核心地位的“工作流”驱动任务。基于现有的 PHP 代码（`SysApprovalConfigLogic.php`, `SysApprovalChainTypeLogic.php`）及相关的 SQL 结构，系统并没有引入传统的重量级工作流引擎（如 Activiti 或 Flowable），而是基于 `sys_approval_chain_*` 表构建了一套**轻量、高度定制化、与业务数据直接绑定**的动态审批流系统。

在即将到来的 Java (Spring Modulith) 重构中，我们将这部分逻辑独立为 `jdec-platform-workflow-api` / `jdec-platform-workflow-biz` 服务模块。

---

## 二、 核心实体与数据库解析
工作流引擎的核心配置与运行时数据，通过以下五张主要的表来支撑：

### 1. 配置时（定义时）数据结构
1. **`sys_approval_chain_type` (审批链分类/模板)**
   - **作用**：定义某个业务模块下的不同类型审批。例如，“员工管理”模块可以有“入职审批”、“离职审批”、“转正审批”等不同的链条类型。
   - **核心字段**：`module_id`（关联的业务模块），`is_default`（默认分类），`is_enable`（是否启用）。
2. **`sys_approval_chain_config` (审批链节点配置)**
   - **作用**：定义审批链上的每一个具体节点（Step）。这是整个引擎的“设计图纸”。
   - **核心字段**：
     - **步骤定义**：`current_step`, `up_step`, `next_step`。
     - **状态流转**：`current_status_group`, `current_status_child` (当前主子状态) ➡️ `next_status_group`, `next_status_child` (通过后的下一状态)。这与 `sys_status` 表强关联。
     - **审批人规则 (`approval_rule`)**：
       - `0`: 指定具体办理人 (`approver_id`) 或移交人 (`delegate_approver_id`)。
       - `1/2/3`: 指定角色组 (`approve_role_id`)。规则 `3` 时支持按百分比审批 (`role_approval_percent`)，如会签/或签。
     - **高级特性**：
       - `is_jump`: 是否允许跳过该节点。
       - `is_auto_approve` & `auto_approve_time` & `deadline`: 自动审批及超时办理规则。
       - `is_ollaboration` (协同办理): 支持多人协同处理一个节点。
       - `child_modules`: 子模块关联配置。
3. **`sys_approval_chain_config_button` (节点按钮与动作配置)**
   - **作用**：定义在这个节点下，审批人能在 UI 上看到哪些操作按钮（同意、驳回、退回修改等）。
   - **特性**：配置中集成了消息模板 (`msg_template_ids`)，当点击该按钮时，触发关联的企微或系统消息通知。

### 2. 运行时（实例执行时）数据结构
4. **`sys_approval_chain` (审批链运行实例/流水记录)**
   - **作用**：当一个业务单据（例如：员工张三的离职申请）提交时，系统基于 `sys_approval_chain_config` 复制出一条（或一系列）具体的运行实例数据。
   - **核心字段**：
     - 大部分字段与 Config 表结构相似，但多了一些运行时状态：
     - `approver_id_list`: 记录当前步骤已审批的人员（支持会签百分比计算）。
     - `approval_uid`: 最终审批该节点的人。
     - `is_approved`: `0` 待审批，`1` 已审批。
     - `pid_module_hash`, `number`: 关联具体的业务单据数据。
5. **`sys_approval_chain_button` (实例按钮)**
   - **作用**：从配置表复制过来，具体到某次实例的可用按钮，记录其操作结果（如 `log_name` 日志描述）。

---

## 三、 现有 PHP 代码逻辑解析 (`SysApprovalConfigLogic` 等)

### 1. 链表结构的维护 (Step Management)
在 `SysApprovalConfigLogic::update()` 中，系统实现了一套非常严谨的链表管理算法。当我们在中间插入或删除一个节点时：
- **新增中间节点**：
  获取 `up_info`（上一个节点）和 `next_info`（下一个节点）。将新节点插入中间，并更新 `up_info` 的 `next_status_group` 和 `next_info` 的 `current_status_group` 以保持状态连续。同时，之后所有的节点的 `current_step`, `up_step`, `next_step` 都会自动 `+1`。
- **删除中间节点**：
  不仅软删除当前节点，还将 `up_info` 的下一步状态指向 `next_info`，修复断链，并将后续所有步骤号 `-1`。

### 2. 状态机绑定 (Status Machine Binding)
PHP 代码强制要求节点的前后状态必须衔接。例如：
- 如果步骤一的 `next_status_group` (下一状态) 是 "部门经理已审批" (ID: 5)。
- 则步骤二的 `current_status_group` (当前状态) 必须是 "部门经理已审批" (ID: 5)。
- `SysApprovalConfigLogic::save()` 中进行了严格的冲突检测：`$up_info['current_status_group'] == $info['next_status_group']` 报错。

### 3. 多分支与子模块控制 (`child_modules`)
虽然这是一个线性的链表结构，但通过 `child_modules` 字段，它可以实现特定节点唤起子表单的填报。例如：入职审批走到第 3 步（IT部配置节点），需要 IT 专员填写发放的电脑资产表单。这就是一种轻量级的协同机制。

---

## 四、 重构方案设计

将此系统提取为独立的 `Workflow Engine`，我们需要做如下技术架构规划：

### 1. 放弃引入重量级引擎，继续自研改进
现有的表结构与 HR 的动态表单、状态机高度捆绑，如果强行引入 Activiti/Flowable，将会面临巨大的数据同步和状态同步成本。因此，重构的**核心策略是：复刻现有表结构，重写流转算法，并大幅优化性能。**

### 2. API 接口与 DTO 设计 (`workflow-api`)
```java
// 供业务模块调用的工作流接口
public interface WorkflowService {
    // 提交一个新单据，生成审批实例
    WorkflowInstanceDTO startProcess(Long moduleId, Long businessId, String approvalChainType);

    // 审批节点通过
    void approveNode(Long chainInstanceId, Long approverUserId, String comments);

    // 审批节点驳回
    void rejectNode(Long chainInstanceId, Long approverUserId, String reason);
}
```

### 3. 核心流转引擎 (`workflow-biz`) 的优化
- **双向链表的维护**：PHP 里面的 Step `+1` / `-1` 逻辑非常脆弱且有并发更新风险。在 Java 中，建议在配置更新时使用分布式锁，或者使用**链表指针结构**（只保存 `up_id` 和 `next_id`，而不是依赖数字的 `current_step` 去全局算序号）。
- **审批规则策略模式 (Strategy Pattern)**：
  针对 `approval_rule` (个人、角色、百分比会签)，在 Java 中实现 `ApproverResolverStrategy` 接口：
  - `UserApproverStrategy`
  - `RoleApproverStrategy`
  - `PercentSignApproverStrategy` (会签：检查 `approver_id_list` 是否达到设定的 `%`)
- **自动审批与超时引擎 (Auto-Approve Engine)**：
  原来 PHP 是通过定时任务 / 事件触发。在 Spring Boot 中，使用 Spring Quartz 或 `@Scheduled`，配合 Redisson 的延迟队列 (Delayed Queue)。当实例到达一个配置了 `is_auto_approve = 1` 的节点，将该节点压入 Redis 延迟队列。到期后，系统通过一个 Worker 自动调用 `approveNode()`。

### 4. 系统解耦 (Spring Modulith Events)
当审批流状态发生变更时，工作流引擎**不直接操作业务表**。
通过 Spring 的应用事件机制向外广播状态变更：
```java
// 引擎抛出事件
applicationEventPublisher.publishEvent(new WorkflowStatusChangedEvent(businessId, nextStatusGroupId));

// 业务模块 (HR-Biz) 监听事件并更新自己的状态
@ApplicationModuleListener
void onWorkflowStatusChanged(WorkflowStatusChangedEvent event) {
    hrBusinessService.updateStatus(event.getBusinessId(), event.getNewStatusId());
}
```
通过这种事件驱动架构，我们彻底解耦了“工作流核心流转逻辑”与“具体人事档案/表单状态”。