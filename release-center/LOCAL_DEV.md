# 本地开发指南 (无 Docker 环境)

如果您没有 Docker 环境，或者希望在宿主机上直接进行开发调试，请按照以下步骤启动 DevOps 发布中心。

## 1. 启动后端 (NestJS + Prisma + SQLite)

后端需要 Node.js 环境 (建议 Node.js 18+)。默认使用本地的 SQLite 数据库，因此无需安装额外的数据库系统。但如果需要完整的 Redis 缓存支持（比如后续接入真实的 BullMQ），您需要在本地运行一个 Redis 实例。不过对于当前 MVP，缺少 Redis 也能启动基础 API 服务。

打开一个终端窗口，执行：

```bash
cd release-center/backend

# 安装依赖
npm install

# 初始化 Prisma 并在本地生成 SQLite 数据库结构
npx prisma db push

# 生成 Prisma 客户端
npx prisma generate

# 启动 NestJS 后端开发服务器（开启热更新）
npm run start:dev
```
*后端服务将运行在 `http://localhost:3000`*

## 2. 启动前端 (Vue 3 + Vite)

前端需要 Node.js 环境。

打开另一个新的终端窗口，执行：

```bash
cd release-center/frontend

# 安装依赖
npm install

# 启动 Vite 前端开发服务器（开启热更新）
npm run dev
```

*前端服务将运行在 `http://localhost:5173` (具体端口请参考 Vite 启动输出)*

> **代理说明：**
> 前端 `vite.config.ts` 已配置了代理映射。在本地开发时，前端请求的 `/api/*` 会自动转发给宿主机的后端 `http://localhost:3000`，彻底解决跨域问题。

## 3. 测试与体验

启动两端后，在浏览器中访问前端地址（例如 `http://localhost:5173`）。
- 默认账户密码为：`admin` / `admin`。
- 如果是第一次使用 `admin` 登录，系统会自动在本地 SQLite 数据库中创建该测试账号。
