import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MockYunxiaoProvider } from '../providers/yunxiao/yunxiao.provider';

@Injectable()
export class ReleasesService {
  private readonly logger = new Logger(ReleasesService.name);

  constructor(
    private prisma: PrismaService,
    private yunxiaoProvider: MockYunxiaoProvider
  ) {}

  async findAll() {
    return this.prisma.releaseOrder.findMany({
      include: { application: true, environment: true, creator: true }
    });
  }

  async findOne(id: number) {
    return this.prisma.releaseOrder.findUnique({
      where: { id },
      include: { application: true, environment: true, history: true }
    });
  }

  async create(data: any, userId: number) {
    const releaseNo = `RO-${Date.now()}`;
    return this.prisma.releaseOrder.create({
      data: {
        ...data,
        releaseNo,
        creatorId: userId,
        status: 'DRAFT'
      }
    });
  }

  async submitForApproval(id: number) {
    return this.prisma.releaseOrder.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL' }
    });
  }

  async approve(id: number) {
    return this.prisma.releaseOrder.update({
      where: { id },
      data: { status: 'APPROVED' }
    });
  }

  async execute(id: number) {
    const release = await this.prisma.releaseOrder.findUnique({
      where: { id },
      include: { application: true, environment: true }
    });

    if (!release) throw new BadRequestException('Release not found');
    if (release.status !== 'APPROVED') throw new BadRequestException('Release must be APPROVED');

    // In a real system, we'd check release windows here

    await this.prisma.releaseOrder.update({
      where: { id },
      data: { status: 'RELEASING' }
    });

    try {
      const pipelineId = release.application.yunxiaoPipelineId || 'mock-pipeline';
      const result = await this.yunxiaoProvider.executeRelease(pipelineId, { version: release.version });

      const updated = await this.prisma.releaseOrder.update({
        where: { id },
        data: { pipelineRunId: result.runId }
      });

      // Simulate polling / completion
      this.simulateReleaseCompletion(id, result.runId);

      return updated;
    } catch (error) {
       this.logger.error('Release execution failed', error);
       return this.prisma.releaseOrder.update({
         where: { id },
         data: { status: 'FAILED' }
       });
    }
  }

  private async simulateReleaseCompletion(id: number, runId: string) {
    setTimeout(async () => {
       const statusResult = await this.yunxiaoProvider.queryReleaseStatus(runId);

       await this.prisma.releaseOrder.update({
         where: { id },
         data: { status: statusResult.status }
       });

       await this.prisma.releaseHistory.create({
         data: {
           releaseOrderId: id,
           status: statusResult.status,
           runRecord: JSON.stringify(statusResult)
         }
       });

       this.logger.log(`Release ${id} completed with status ${statusResult.status}`);
    }, 5000); // Wait 5 seconds to simulate release
  }

  async rollback(id: number) {
    const release = await this.prisma.releaseOrder.findUnique({ where: { id }, include: { application: true } });
    if (!release) throw new BadRequestException('Release not found');

    await this.prisma.releaseOrder.update({
      where: { id },
      data: { status: 'ROLLBACK' }
    });

    const pipelineId = release.application.yunxiaoPipelineId || 'mock-pipeline';
    await this.yunxiaoProvider.rollbackRelease(pipelineId, release.version);

    await this.prisma.releaseHistory.create({
         data: {
           releaseOrderId: id,
           status: 'ROLLBACK',
           runRecord: 'Rollback initiated'
         }
    });

    return { status: 'ROLLBACK_INITIATED' };
  }
}