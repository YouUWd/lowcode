import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { WorkflowService, WorkflowStartPayload, WorkflowTaskPayload } from './workflow.service';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('start')
  async startProcess(@Body() dto: WorkflowStartPayload) {
    return this.workflowService.startProcess(dto);
  }

  @Post('handle/:businessNo')
  async handleTask(
    @Param('businessNo') businessNo: string,
    @Body() dto: WorkflowTaskPayload,
  ) {
    return this.workflowService.handleTask(businessNo, dto);
  }

  @Get('panorama/:businessNo')
  async getPanorama(@Param('businessNo') businessNo: string) {
    return this.workflowService.getWorkflowPanorama(businessNo);
  }

  @Get('instances')
  async getAllInstances() {
    return this.workflowService.findAllInstances();
  }

  @Get('tasks/:businessNo')
  async getTasks(@Param('businessNo') businessNo: string) {
    return this.workflowService.getActiveTasks(businessNo);
  }

  @Post('mock-data-change/:businessNo')
  async mockDataChange(@Param('businessNo') businessNo: string) {
    return this.workflowService.mockDataChange(businessNo);
  }
}
