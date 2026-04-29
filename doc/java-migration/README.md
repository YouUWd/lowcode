# Lumina 动态查询引擎 - Java 迁移文档

## 📋 文档清单

本目录包含了将 Lumina 动态查询引擎从 NestJS 迁移到 Java Spring Boot 的完整文档。

### 核心文档

| 文档 | 文件名 | 说明 |
|------|--------|------|
| **需求文档** | `01-requirements-document.md` | 项目需求、功能模块、API 接口、数据模型、验收标准 |
| **架构文档** | `02-architecture-document.md` | 系统架构、技术栈、核心模块设计、数据访问层、缓存策略 |
| **技术实现** | `03-technical-implementation.md` | 核心类设计、数据模型、异常处理、代码示例 |
| **API 设计** | `04-api-design.md` | RESTful API 规范、请求响应格式、错误处理、示例代码 |
| **数据库设计** | `05-database-design.md` | MySQL 表结构、字段设计、索引、关系图、性能优化 |
| **测试计划** | `06-testing-plan.md` | 单元测试、集成测试、性能测试、安全测试、覆盖率 |
| **部署运维** | `07-deployment-operations.md` | Docker 部署、Kubernetes、监控日志、备份恢复、故障排查 |

### 参考文档

| 文档 | 文件名 | 说明 |
|------|--------|------|
| **数据库脚本** | `database-schema.sql` | MySQL 完整数据库脚本 |
| **架构参考** | `../springboot_jooq_architecture.md` | Spring Boot + jOOQ 架构方案 |

## 🎯 快速开始

### 1. 理解需求
首先阅读 **需求文档** (`01-requirements-document.md`)，了解：
- 项目背景和目标
- 核心功能模块
- 数据模型
- API 接口规范

### 2. 学习架构
然后阅读 **架构文档** (`02-architecture-document.md`)，理解：
- 系统整体架构
- 技术栈选型
- 核心模块设计
- 分层架构

### 3. 实现代码
参考 **技术实现** (`03-technical-implementation.md`)，学习：
- 核心类的实现方式
- 数据模型定义
- 异常处理机制
- 代码示例

### 4. 设计 API
查看 **API 设计** (`04-api-design.md`)，了解：
- API 端点定义
- 请求响应格式
- 错误处理
- 使用示例

### 5. 设计数据库
参考 **数据库设计** (`05-database-design.md`)，学习：
- 表结构设计
- 字段定义
- 索引策略
- 性能优化

### 6. 编写测试
查看 **测试计划** (`06-testing-plan.md`)，了解：
- 单元测试编写
- 集成测试编写
- 性能测试方法
- 覆盖率要求

### 7. 部署上线
参考 **部署运维** (`07-deployment-operations.md`)，学习：
- Docker 部署
- Kubernetes 部署
- 监控和日志
- 故障排查

## 📊 项目结构

```
lumina-java/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/lumina/
│   │   │       ├── controller/          # 控制层
│   │   │       ├── service/             # 业务层
│   │   │       ├── repository/          # 数据访问层
│   │   │       ├── entity/              # 实体类
│   │   │       ├── dto/                 # 数据传输对象
│   │   │       ├── exception/           # 异常类
│   │   │       ├── config/              # 配置类
│   │   │       └── util/                # 工具类
│   │   └── resources/
│   │       ├── application.yml          # 应用配置
│   │       ├── application-dev.yml      # 开发环境配置
│   │       ├── application-prod.yml     # 生产环境配置
│   │       └── logback-spring.xml       # 日志配置
│   └── test/
│       └── java/
│           └── com/lumina/              # 测试类
├── doc/
│   └── java-migration/                  # 迁移文档
├── pom.xml                              # Maven 配置
├── Dockerfile                           # Docker 配置
└── docker-compose.yml                   # Docker Compose 配置
```

## 🔧 技术栈

### 后端框架
- **Spring Boot 3.2.x**: 主应用框架
- **Spring Data JPA**: ORM 框架
- **jOOQ 3.19.x**: 类型安全的 SQL 构建
- **Spring Security**: 安全框架
- **Spring Cache**: 缓存框架

### 数据库
- **MySQL 8.0+**: 主数据库
- **Redis 7.0+**: 缓存数据库

### 测试框架
- **JUnit 5**: 单元测试
- **Mockito**: Mock 框架
- **Spring Test**: 集成测试

### 构建工具
- **Maven 3.9+**: 项目构建
- **Docker**: 容器化
- **Kubernetes**: 容器编排

## 📈 开发流程

### Phase 1: 基础架构 (2周)
- [ ] 搭建 Spring Boot 项目
- [ ] 配置 jOOQ 代码生成
- [ ] 实现数据库连接管理
- [ ] 实现基础的模块加载

### Phase 2: 查询引擎 (3周)
- [ ] 实现主查询逻辑
- [ ] 实现子查询逻辑
- [ ] 实现字段映射
- [ ] 实现 SQL 构建

### Phase 3: 权限控制 (1周)
- [ ] 实现权限模型
- [ ] 实现权限过滤
- [ ] 实现权限管理接口

### Phase 4: 数据转换 (2周)
- [ ] 实现数据库级转换
- [ ] 实现前端级转换
- [ ] 实现转换器扩展机制

### Phase 5: 测试与优化 (2周)
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化
- [ ] 文档完善

## 🚀 部署指南

### 开发环境
```bash
# 1. 克隆项目
git clone https://github.com/your-org/lumina-java.git
cd lumina-java

# 2. 启动依赖服务
docker-compose up -d

# 3. 构建项目
mvn clean package -DskipTests

# 4. 启动应用
java -jar target/lumina-server-1.0.0.jar
```

### 生产环境
```bash
# 1. 构建 Docker 镜像
docker build -t lumina-server:1.0.0 .

# 2. 推送到镜像仓库
docker push your-registry/lumina-server:1.0.0

# 3. 部署到 Kubernetes
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

## 📝 关键设计决策

### 1. 双数据库架构
- **配置数据库** (lumina_config): 存储模块配置、字段映射、权限配置
- **业务数据库** (lumina_business): 存储实际业务数据

**优势**:
- 配置和业务数据分离
- 便于配置版本管理
- 支持多业务数据库

### 2. jOOQ 作为 SQL 构建工具
- 类型安全的 SQL 构建
- 完全防止 SQL 注入
- 支持多数据库方言

**vs Hibernate**:
- jOOQ: 更灵活，适合动态 SQL
- Hibernate: 更简单，适合标准 CRUD

### 3. Redis 缓存策略
- 模块配置缓存
- 权限配置缓存
- 字典数据缓存

**缓存键设计**:
```
module:config:{moduleId}
permission:module:{moduleId}
dict:{dictCode}:{dictValue}
```

### 4. 权限模型
- 权限节点格式: `{entity}.{field}.{operation}`
- 操作类型: READ, CREATE, UPDATE
- 支持字段级和行级权限

## 🔐 安全考虑

### SQL 注入防护
- 使用 jOOQ DSL 构建 SQL，参数自动绑定
- 不拼接 SQL 字符串
- 类型安全检查

### 认证与授权
- JWT Token 认证
- Spring Security 权限控制
- 字段级权限过滤

### 敏感数据保护
- 数据脱敏转换
- 加密存储
- 审计日志记录

## 📊 性能指标

### 目标指标
| 指标 | 目标值 |
|------|--------|
| 单次查询响应时间 | < 500ms |
| 并发查询 (100 并发) | < 1000ms |
| 缓存命中率 | > 80% |
| 错误率 | < 0.1% |

### 优化策略
- 多级缓存 (本地 + Redis)
- 数据库索引优化
- 连接池管理
- JVM 调优

## 🐛 常见问题

### Q: 如何添加新的转换器?
A: 实现 `Transformer` 接口，注册到 `TransformerRegistry`，在 `TransformerService` 中调用。

### Q: 如何支持新的数据库?
A: 修改 jOOQ 配置中的 `SQLDialect`，调整 SQL 方言转换逻辑。

### Q: 如何扩展权限模型?
A: 修改 `PermissionService`，支持更复杂的权限规则。

### Q: 如何优化查询性能?
A: 创建必要的索引，使用缓存，优化 SQL 查询，调整 JVM 参数。

## 📚 参考资源

### 官方文档
- [Spring Boot 官方文档](https://spring.io/projects/spring-boot)
- [jOOQ 官方文档](https://www.jooq.org/doc/latest/manual/)
- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [Redis 官方文档](https://redis.io/documentation)

### 相关项目
- [NestJS 版本](../../../lumina-server)
- [Vue 前端](../../../lumina-vue)

## 📞 联系方式

- **项目负责人**: [Your Name]
- **技术支持**: [Support Email]
- **问题反馈**: [Issue Tracker]

## 📄 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

## 🙏 致谢

感谢所有贡献者和使用者的支持！

---

**最后更新**: 2024-01-15
**文档版本**: 1.0.0
**维护者**: Lumina Team
