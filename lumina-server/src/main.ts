import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Lumina Low-Code Platform - Backend Server
 * 
 * 启动配置:
 * - 端口: 3001
 * - CORS: 已启用 (允许跨域请求)
 * - 监听地址: 0.0.0.0 (允许外部访问)
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // 启用 CORS 支持前端跨域请求
  app.enableCors({
    origin: true, // 开发环境允许所有来源
    credentials: true,
  });

  // 设置全局前缀
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);

  console.log(`\n🚀 Lumina Backend Server is running on: http://localhost:${port}/api`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/modules`);
  console.log(`🔒 Permissions API: http://localhost:${port}/api/permissions/config\n`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
