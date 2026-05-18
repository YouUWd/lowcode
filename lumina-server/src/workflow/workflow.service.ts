import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';
import { EventEmitter2 } from '@nestjs/event-emitter';

export class WorkflowStartPayload {
  moduleId: string;
  targetEntity?: string;
  targetRecordId?: string;
  actionType: 'INSERT' | 'UPDATE' | 'DELETE' | 'CUSTOM';
  reason?: string;
  payload?: Record<string, any>;
  submitterId: string;
}

export class WorkflowTaskPayload {
  taskId: number;
  action: 'PASS' | 'REJECT';
  comment?: string;
  userId: string;
}

@Injectable()
export class WorkflowService {
  constructor(
    @Inject('CONFIG_DB') private readonly configDb: Knex,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 生成唯一业务单号
   */
  private generateBusinessNo(moduleId: string): string {
    const prefix = moduleId.replace('MOD-', '');
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REQ-${prefix}-${timestamp}-${random}`;
  }

  /**
   * 发起审批流程
   */
  async startProcess(data: WorkflowStartPayload) {
    console.log(`[Workflow] 发起流程: ${data.moduleId}`);

    const trx = await this.configDb.transaction();
    try {
      // 1. 查找起点配置 (up_id = 0)
      const startNode = await trx('sys_approval_chain_config')
        .where({ module_id: data.moduleId, up_id: 0 })
        .first();

      if (!startNode) {
        throw new NotFoundException(`模块 ${data.moduleId} 未找到起点审批配置`);
      }

      const businessNo = this.generateBusinessNo(data.moduleId);

      // 2. 插入统一流程实例 (载荷)
      await trx('sys_approval_instance').insert({
        business_no: businessNo,
        module_id: data.moduleId,
        title: `${data.moduleId} 业务流转申请`,
        target_entity: data.targetEntity,
        target_record_id: data.targetRecordId,
        action_type: data.actionType,
        reason: data.reason,
        payload: data.payload ? JSON.stringify(data.payload) : null,
        macro_status: 1, // 1: 审批中
        submitter_id: data.submitterId,
      });

      // 3. 根据节点类型生成微观 Task
      await this.generateTasksForNode(trx, businessNo, startNode);

      // 4. 写系统日志
      await trx('sys_approval_log').insert({
        business_no: businessNo,
        action_type: 'submit',
        operator: data.submitterId,
        comment: '发起流程并提交业务草稿',
        is_system: false,
      });

      await trx.commit();
      console.log(`[Workflow] 流程发起成功: ${businessNo}`);
      return { businessNo };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * 处理节点任务 (同意或驳回)
   */
  async handleTask(businessNo: string, data: WorkflowTaskPayload) {
    console.log(`[Workflow] 处理任务: ${businessNo}, TaskID: ${data.taskId}, Action: ${data.action}`);

    const trx = await this.configDb.transaction();
    try {
      const task = await trx('sys_approval_task')
        .where({ id: data.taskId, business_no: businessNo, status: 'PENDING' })
        .first();

      if (!task) {
        throw new NotFoundException('找不到待处理的任务，或已被处理/作废');
      }

      const nodeConfig = await trx('sys_approval_chain_config')
        .where({ id: task.node_id })
        .first();

      // 1. 更新任务状态
      await trx('sys_approval_task')
        .where({ id: data.taskId })
        .update({ status: data.action });

      // 2. 写日志
      await trx('sys_approval_log').insert({
        business_no: businessNo,
        action_type: data.action.toLowerCase(),
        operator: data.userId,
        node_name: nodeConfig.node_name,
        comment: data.comment || (data.action === 'PASS' ? '审批通过' : '审批驳回'),
      });

      // 3. 推进或打回逻辑
      if (data.action === 'REJECT') {
        await this.handleReject(trx, businessNo, nodeConfig);
      } else {
        await this.handlePass(trx, businessNo, nodeConfig, task);
      }

      await trx.commit();
      return { success: true };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * 处理通过逻辑 (包含 Fork-Join 汇聚)
   */
  private async handlePass(trx: Knex.Transaction, businessNo: string, nodeConfig: any, currentTask: any) {
    // 若当前是并行组分支，需要检查是否组内所有任务都已 PASS
    if (nodeConfig.node_type === 'parallel_group') {
      const pendingBranches = await trx('sys_approval_task')
        .where({ business_no: businessNo, node_id: nodeConfig.id })
        .whereNot('status', 'PASS');

      if (pendingBranches.length > 0) {
        // 汇聚未完成，按兵不动
        console.log(`[Workflow] 并行组 ${nodeConfig.node_name} 等待其他分支汇聚...`);
        return;
      }
    }

    // 单节点通过，或并行组全部通过，寻找下一步
    if (nodeConfig.next_id === 0) {
      // 流程结束
      await this.finalizeProcess(trx, businessNo);
    } else {
      // 推进到下一步
      const nextNode = await trx('sys_approval_chain_config').where({ id: nodeConfig.next_id }).first();
      if (!nextNode) throw new Error('流转异常：找不到下一个节点配置');
      await this.generateTasksForNode(trx, businessNo, nextNode);
    }
  }

  /**
   * 处理驳回逻辑
   */
  private async handleReject(trx: Knex.Transaction, businessNo: string, nodeConfig: any) {
    // 为了 Demo 简单起见，这里实现最直接的：作废实例
    await trx('sys_approval_instance')
      .where({ business_no: businessNo })
      .update({ macro_status: -99 }); // 作废

    // 通知系统
    const instance = await trx('sys_approval_instance').where({ business_no: businessNo }).first();
    this.eventEmitter.emit(`workflow.process.rejected.${instance.module_id}`, {
      businessNo,
      reason: '审批驳回导致流程终止',
    });
  }

  /**
   * 流程完结，发布事件交还给业务系统
   */
  private async finalizeProcess(trx: Knex.Transaction, businessNo: string) {
    // 1. 更新宏观状态
    await trx('sys_approval_instance')
      .where({ business_no: businessNo })
      .update({ macro_status: 99 }); // 已生效

    const instance = await trx('sys_approval_instance').where({ business_no: businessNo }).first();

    // 2. 抛出特定模块的审批完成事件
    const payloadParsed = instance.payload ? JSON.parse(instance.payload) : {};
    
    console.log(`[Workflow] 流程 ${businessNo} 终审通过，向全系统广播事件 workflow.process.approved.${instance.module_id}`);
    
    this.eventEmitter.emit(`workflow.process.approved.${instance.module_id}`, {
      businessNo,
      moduleId: instance.module_id,
      targetEntity: instance.target_entity,
      targetRecordId: instance.target_record_id,
      actionType: instance.action_type,
      payload: payloadParsed,
    });
  }

  /**
   * 核心：为特定节点生成 Task
   */
  private async generateTasksForNode(trx: Knex.Transaction, businessNo: string, nodeConfig: any) {
    if (nodeConfig.node_type === 'user_task') {
      await trx('sys_approval_task').insert({
        business_no: businessNo,
        node_id: nodeConfig.id,
        branch_id: null,
        status: 'PENDING',
      });
    } else if (nodeConfig.node_type === 'parallel_group') {
      const branches = JSON.parse(nodeConfig.parallel_branches || '[]');
      const tasks = branches.map((b: any) => ({
        business_no: businessNo,
        node_id: nodeConfig.id,
        branch_id: b.branch_id,
        status: 'PENDING',
      }));
      if (tasks.length > 0) {
        await trx('sys_approval_task').insert(tasks);
      }
    }
  }

  /**
   * 暴露给前端 DTO 组装的方法：获取单据的工作流全景视图
   */
  async getWorkflowPanorama(businessNo: string) {
    const instance = await this.configDb('sys_approval_instance').where({ business_no: businessNo }).first();
    if (!instance) return null;

    const tasks = await this.configDb('sys_approval_task').where({ business_no: businessNo });
    const logs = await this.configDb('sys_approval_log').where({ business_no: businessNo }).orderBy('id', 'asc');

    // 获取该模块的完整审批链配置
    const allNodes = await this.configDb('sys_approval_chain_config')
      .where({ module_id: instance.module_id })
      .orderBy('id', 'asc');

    // 简单的链表排序逻辑（基于 up_id/next_id）
    const orderedNodes: any[] = [];
    let curr = allNodes.find(n => n.up_id == 0);
    while (curr) {
      orderedNodes.push(curr);
      const nextNode = allNodes.find(n => n.up_id == curr.id);
      if (nextNode && !orderedNodes.find(on => on.id == nextNode.id)) {
        curr = nextNode;
      } else {
        curr = null;
      }
    }

    // 获取当前活跃的节点信息
    const activeTasks = tasks.filter(t => t.status === 'PENDING');
    const passedNodeIds = [...new Set(tasks.filter(t => t.status === 'PASS').map(t => t.node_id))];
    const invalidatedNodeIds = [...new Set(tasks.filter(t => t.status === 'INVALIDATED').map(t => t.node_id))];

    const safeJsonParse = (str: any, defaultVal: any) => {
      try {
        return str ? JSON.parse(str) : defaultVal;
      } catch (e) {
        return defaultVal;
      }
    };

    return {
      businessNo,
      title: instance.title,
      macroStatus: instance.macro_status,
      targetEntity: instance.target_entity,
      targetRecordId: instance.target_record_id,
      payload: safeJsonParse(instance.payload, {}),
      reason: instance.reason,
      nodes: orderedNodes.map(n => ({
        id: n.id,
        name: n.node_name,
        type: n.node_type,
        rule: n.approval_rule,
        role: n.role_target,
        branches: safeJsonParse(n.parallel_branches, []),
        status: activeTasks.some(at => at.node_id === n.id) ? 'ACTIVE' : 
                (passedNodeIds.includes(n.id) ? 'PASSED' : 
                (invalidatedNodeIds.includes(n.id) ? 'INVALIDATED' : 'PENDING'))
      })),
      tasks: tasks.map(t => ({
        id: t.id,
        nodeId: t.node_id,
        branchId: t.branch_id,
        status: t.status
      })),
      logs: logs.map(l => ({
        action: l.action_type,
        operator: l.operator,
        node: l.node_name,
        comment: l.comment,
        time: l.created_at,
        isSystem: !!l.is_system
      }))
    };
  }

  /**
   * 获取系统中所有的流程实例 (用于管理列表)
   */
  async findAllInstances() {
    const instances = await this.configDb('sys_approval_instance').orderBy('created_at', 'desc');
    const results: any[] = [];

    for (const inst of instances) {
      // 聚合每个实例的当前待办节点名称
      const activeTasks = await this.configDb('sys_approval_task')
        .where({ business_no: inst.business_no, status: 'PENDING' });
      
      let activeNodes: string[] = [];
      if (activeTasks.length > 0) {
        const nodeIds = [...new Set(activeTasks.map(t => t.node_id))];
        const nodes = await this.configDb('sys_approval_chain_config').whereIn('id', nodeIds);
        activeNodes = nodes.map(n => n.node_name);
      }

      results.push({
        businessNo: inst.business_no,
        targetEntity: inst.target_entity,
        macroStatus: inst.macro_status,
        activeNodes: activeNodes,
        title: inst.title,
        createdAt: inst.created_at
      });
    }
    return results;
  }

  /**
   * 获取单据当前活跃的任务
   */
  async getActiveTasks(businessNo: string) {
    const tasks = await this.configDb('sys_approval_task')
      .where({ business_no: businessNo, status: 'PENDING' });

    // Attach nodeConfig
    for (const task of tasks) {
      task.nodeConfig = await this.configDb('sys_approval_chain_config')
        .where({ id: task.node_id })
        .first();
    }
    return tasks;
  }

  /**
   * 模拟业务数据变更，触发靶向回退
   */
  async mockDataChange(businessNo: string) {
    console.log(`[Workflow] 模拟数据变更，触发靶向回退: ${businessNo}`);
    const trx = await this.configDb.transaction();
    try {
      const instance = await trx('sys_approval_instance').where({ business_no: businessNo }).first();
      if (!instance || instance.macro_status !== 1) {
        throw new BadRequestException('该流程未在审批中，无法触发回退');
      }

      // 为了演示靶向回退：
      // 1. 将当前所有的 PENDING 任务作废
      await trx('sys_approval_task')
        .where({ business_no: businessNo, status: 'PENDING' })
        .update({ status: 'INVALIDATED' });

      // 2. 找到配置的"并行组"节点 进行靶向回退
      const parallelNode = await trx('sys_approval_chain_config').where({ module_id: instance.module_id, node_type: 'parallel_group' }).first();
      if (parallelNode) {
        // 作废财务分支 (假设 b2 是财务) 的通过状态，而保留 IT 的通过状态
        await trx('sys_approval_task')
          .where({ business_no: businessNo, node_id: parallelNode.id, branch_id: 'b2', status: 'PASS' })
          .update({ status: 'INVALIDATED' });

        // 重新生成 b2 (财务) 的待办任务
        await trx('sys_approval_task').insert({
          business_no: businessNo,
          node_id: parallelNode.id,
          branch_id: 'b2',
          status: 'PENDING',
        });
      }

      // 3. 记录日志
      await trx('sys_approval_log').insert({
        business_no: businessNo,
        action_type: 'reject',
        operator: 'Engine',
        comment: '检测到业务数据被修改。已触发靶向回退机制，作废[财务/部分并联]等相关节点的确认状态，重新发回原节点审批。',
        is_system: true,
      });

      await trx.commit();
      return { success: true };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}
