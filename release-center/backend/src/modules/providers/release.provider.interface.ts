export interface ReleaseProvider {
  executeRelease(pipelineId: string, params: any): Promise<{ runId: string }>;
  queryReleaseStatus(runId: string): Promise<{ status: string; detail: any }>;
  rollbackRelease(pipelineId: string, version: string): Promise<any>;
}