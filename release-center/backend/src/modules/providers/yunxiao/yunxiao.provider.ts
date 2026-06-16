import { Injectable, Logger } from '@nestjs/common';
import { ReleaseProvider } from '../release.provider.interface';

@Injectable()
export class MockYunxiaoProvider implements ReleaseProvider {
  private readonly logger = new Logger(MockYunxiaoProvider.name);

  async executeRelease(pipelineId: string, params: any): Promise<{ runId: string }> {
    this.logger.log(`Mock executing release for pipeline ${pipelineId} with params:`, params);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { runId: `mock-run-${Date.now()}` };
  }

  async queryReleaseStatus(runId: string): Promise<{ status: string; detail: any }> {
    this.logger.log(`Mock querying status for run ${runId}`);
    // Randomly succeed or fail for MVP after a short time
    const statuses = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    return { status, detail: { runId } };
  }

  async rollbackRelease(pipelineId: string, version: string): Promise<any> {
    this.logger.log(`Mock rolling back pipeline ${pipelineId} to version ${version}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { status: 'SUCCESS', rollbackRunId: `mock-rb-${Date.now()}` };
  }
}