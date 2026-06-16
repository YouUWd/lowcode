import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  async findAll() {
    const data = await this.workflowsService.findAll();
    return { code: 0, message: 'success', data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.workflowsService.findOne(+id);
    return { code: 0, message: 'success', data };
  }

  @Post()
  async create(@Body() createWorkflowDto: CreateWorkflowDto) {
    const data = await this.workflowsService.create(createWorkflowDto);
    return { code: 0, message: 'success', data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateWorkflowDto: UpdateWorkflowDto) {
    const data = await this.workflowsService.update(+id, updateWorkflowDto);
    return { code: 0, message: 'success', data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.workflowsService.remove(+id);
    return { code: 0, message: 'success', data };
  }
}