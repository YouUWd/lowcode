import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('environments')
@UseGuards(JwtAuthGuard)
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Get()
  async findAll() {
    const data = await this.environmentsService.findAll();
    return { code: 0, message: 'success', data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.environmentsService.findOne(+id);
    return { code: 0, message: 'success', data };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.environmentsService.create(body);
    return { code: 0, message: 'success', data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.environmentsService.update(+id, body);
    return { code: 0, message: 'success', data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.environmentsService.remove(+id);
    return { code: 0, message: 'success', data };
  }
}