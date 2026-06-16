import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateReleaseDto } from './dto/create-release.dto';

@Controller('releases')
@UseGuards(JwtAuthGuard)
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  async findAll() {
    const data = await this.releasesService.findAll();
    return { code: 0, message: 'success', data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.releasesService.findOne(+id);
    return { code: 0, message: 'success', data };
  }

  @Post()
  async create(@Body() createReleaseDto: CreateReleaseDto, @Request() req) {
    const data = await this.releasesService.create(createReleaseDto, req.user.id);
    return { code: 0, message: 'success', data };
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    const data = await this.releasesService.submitForApproval(+id);
    return { code: 0, message: 'success', data };
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string) {
    const data = await this.releasesService.approve(+id);
    return { code: 0, message: 'success', data };
  }

  @Post(':id/execute')
  async execute(@Param('id') id: string) {
    const data = await this.releasesService.execute(+id);
    return { code: 0, message: 'success', data };
  }

  @Post(':id/rollback')
  async rollback(@Param('id') id: string) {
    const data = await this.releasesService.rollback(+id);
    return { code: 0, message: 'success', data };
  }
}