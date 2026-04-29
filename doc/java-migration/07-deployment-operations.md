# Lumina 动态查询引擎 - 部署与运维文档

## 1. 部署环境

### 1.1 系统要求

| 组件 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Java | 17 | 21 LTS |
| MySQL | 8.0 | 8.0.35+ |
| Redis | 6.0 | 7.0+ |
| Docker | 20.10 | 24.0+ |
| Kubernetes | 1.24 | 1.28+ |

### 1.2 硬件要求

**开发环境**:
- CPU: 4 核
- 内存: 8 GB
- 磁盘: 50 GB

**生产环境**:
- CPU: 8 核
- 内存: 16 GB
- 磁盘: 200 GB
- 网络: 1 Gbps

### 1.3 网络要求

- 应用服务器与数据库服务器网络连通
- 应用服务器与 Redis 服务器网络连通
- 应用服务器与前端服务器网络连通
- 防火墙开放必要端口

## 2. 单机部署

### 2.1 Docker 部署

#### 2.1.1 Dockerfile

```dockerfile
FROM openjdk:21-jdk-slim

WORKDIR /app

# 复制应用 JAR 文件
COPY target/lumina-server-1.0.0.jar app.jar

# 暴露端口
EXPOSE 8080

# 启动应用
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 2.1.2 Docker Compose

```yaml
version: '3.8'

services:
  # MySQL 配置数据库
  config-db:
    image: mysql:8.0
    container_name: lumina-config-db
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: lumina_config
      MYSQL_CHARSET: utf8mb4
    ports:
      - "3306:3306"
    volumes:
      - config-db-data:/var/lib/mysql
      - ./doc/java-migration/database-schema.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - lumina-network

  # MySQL 业务数据库
  business-db:
    image: mysql:8.0
    container_name: lumina-business-db
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: lumina_business
      MYSQL_CHARSET: utf8mb4
    ports:
      - "3307:3306"
    volumes:
      - business-db-data:/var/lib/mysql
    networks:
      - lumina-network

  # Redis 缓存
  redis:
    image: redis:7.0
    container_name: lumina-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - lumina-network

  # Spring Boot 应用
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: lumina-app
    environment:
      SPRING_DATASOURCE_CONFIG_URL: jdbc:mysql://config-db:3306/lumina_config
      SPRING_DATASOURCE_CONFIG_USERNAME: root
      SPRING_DATASOURCE_CONFIG_PASSWORD: root123
      SPRING_DATASOURCE_BUSINESS_URL: jdbc:mysql://business-db:3306/lumina_business
      SPRING_DATASOURCE_BUSINESS_USERNAME: root
      SPRING_DATASOURCE_BUSINESS_PASSWORD: root123
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
    ports:
      - "8080:8080"
    depends_on:
      - config-db
      - business-db
      - redis
    networks:
      - lumina-network

volumes:
  config-db-data:
  business-db-data:
  redis-data:

networks:
  lumina-network:
    driver: bridge
```

#### 2.1.3 启动应用

```bash
# 构建 Docker 镜像
docker build -t lumina-server:1.0.0 .

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

### 2.2 本地部署

#### 2.2.1 环境配置

创建 `application-prod.yml`:

```yaml
spring:
  application:
    name: lumina-server
  
  datasource:
    config:
      url: jdbc:mysql://localhost:3306/lumina_config?useSSL=false&serverTimezone=UTC&characterEncoding=utf8mb4
      username: root
      password: root123
      driver-class-name: com.mysql.cj.jdbc.Driver
      hikari:
        maximum-pool-size: 20
        minimum-idle: 5
        connection-timeout: 30000
    
    business:
      url: jdbc:mysql://localhost:3307/lumina_business?useSSL=false&serverTimezone=UTC&characterEncoding=utf8mb4
      username: root
      password: root123
      driver-class-name: com.mysql.cj.jdbc.Driver
      hikari:
        maximum-pool-size: 20
        minimum-idle: 5
        connection-timeout: 30000
  
  redis:
    host: localhost
    port: 6379
    timeout: 2000ms
    jedis:
      pool:
        max-active: 20
        max-idle: 10
        min-idle: 5
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  
  jooq:
    sql-dialect: MYSQL

server:
  port: 8080
  servlet:
    context-path: /api
  compression:
    enabled: true
    min-response-size: 1024

logging:
  level:
    root: INFO
    com.lumina: DEBUG
  file:
    name: logs/lumina.log
    max-size: 10MB
    max-history: 30
```

#### 2.2.2 启动应用

```bash
# 编译项目
mvn clean package -DskipTests

# 启动应用
java -jar target/lumina-server-1.0.0.jar --spring.profiles.active=prod

# 或使用 Maven 插件
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=prod"
```

## 3. 集群部署

### 3.1 Kubernetes 部署

#### 3.1.1 Deployment 配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lumina-app
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: lumina-app
  template:
    metadata:
      labels:
        app: lumina-app
    spec:
      containers:
      - name: lumina-app
        image: lumina-server:1.0.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_DATASOURCE_CONFIG_URL
          value: jdbc:mysql://mysql-config:3306/lumina_config
        - name: SPRING_DATASOURCE_CONFIG_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: SPRING_DATASOURCE_CONFIG_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: SPRING_REDIS_HOST
          value: redis-master
        - name: SPRING_REDIS_PORT
          value: "6379"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
```

#### 3.1.2 Service 配置

```yaml
apiVersion: v1
kind: Service
metadata:
  name: lumina-app-service
  namespace: default
spec:
  type: LoadBalancer
  selector:
    app: lumina-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

#### 3.1.3 部署命令

```bash
# 创建 Secret
kubectl create secret generic db-credentials \
  --from-literal=username=root \
  --from-literal=password=root123

# 部署应用
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# 查看部署状态
kubectl get deployments
kubectl get pods
kubectl get services

# 查看日志
kubectl logs -f deployment/lumina-app

# 扩展副本
kubectl scale deployment lumina-app --replicas=5

# 更新镜像
kubectl set image deployment/lumina-app \
  lumina-app=lumina-server:1.0.1
```

### 3.2 负载均衡

#### 3.2.1 Nginx 配置

```nginx
upstream lumina_backend {
    server app1:8080 weight=1;
    server app2:8080 weight=1;
    server app3:8080 weight=1;
    keepalive 32;
}

server {
    listen 80;
    server_name api.lumina.com;

    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain application/json;
    gzip_min_length 1000;

    # 限流
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_req zone=api_limit burst=200 nodelay;

    location /api/ {
        limit_req zone=api_limit burst=200 nodelay;
        
        proxy_pass http://lumina_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # 健康检查
    location /health {
        access_log off;
        proxy_pass http://lumina_backend;
    }
}
```

## 4. 数据库初始化

### 4.1 创建数据库

```bash
# 连接 MySQL
mysql -u root -p

# 创建配置数据库
CREATE DATABASE lumina_config CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建业务数据库
CREATE DATABASE lumina_business CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建应用用户
CREATE USER 'lumina'@'%' IDENTIFIED BY 'lumina123';
GRANT ALL PRIVILEGES ON lumina_config.* TO 'lumina'@'%';
GRANT ALL PRIVILEGES ON lumina_business.* TO 'lumina'@'%';
FLUSH PRIVILEGES;
```

### 4.2 初始化表结构

```bash
# 导入数据库脚本
mysql -u root -p lumina_config < doc/java-migration/database-schema.sql
mysql -u root -p lumina_business < doc/java-migration/database-schema.sql
```

## 5. 监控与日志

### 5.1 应用监控

#### 5.1.1 Actuator 端点

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus,info
  endpoint:
    health:
      show-details: always
  metrics:
    export:
      prometheus:
        enabled: true
```

#### 5.1.2 监控指标

```bash
# 健康检查
curl http://localhost:8080/actuator/health

# 应用信息
curl http://localhost:8080/actuator/info

# 性能指标
curl http://localhost:8080/actuator/metrics

# Prometheus 格式
curl http://localhost:8080/actuator/prometheus
```

### 5.2 日志管理

#### 5.2.1 Logback 配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property name="LOG_FILE" value="logs/lumina.log"/>
    <property name="LOG_PATTERN" value="%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"/>

    <!-- 控制台输出 -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>${LOG_PATTERN}</pattern>
        </encoder>
    </appender>

    <!-- 文件输出 -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_FILE}</file>
        <encoder>
            <pattern>${LOG_PATTERN}</pattern>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>logs/lumina-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
            <maxFileSize>10MB</maxFileSize>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
    </appender>

    <!-- 异步输出 -->
    <appender name="ASYNC_FILE" class="ch.qos.logback.classic.AsyncAppender">
        <queueSize>512</queueSize>
        <discardingThreshold>0</discardingThreshold>
        <appender-ref ref="FILE"/>
    </appender>

    <!-- 日志级别 -->
    <logger name="com.lumina" level="DEBUG"/>
    <logger name="org.springframework" level="INFO"/>
    <logger name="org.jooq" level="DEBUG"/>

    <!-- 根日志 -->
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="ASYNC_FILE"/>
    </root>
</configuration>
```

### 5.3 ELK Stack 集成

#### 5.3.1 Logstash 配置

```conf
input {
  file {
    path => "/app/logs/lumina.log"
    start_position => "beginning"
    codec => multiline {
      pattern => "^%{TIMESTAMP_ISO8601}"
      negate => true
      what => "previous"
    }
  }
}

filter {
  grok {
    match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} \[%{DATA:thread}\] %{LOGLEVEL:level} %{DATA:logger} - %{GREEDYDATA:msg}" }
  }
  
  date {
    match => [ "timestamp", "yyyy-MM-dd HH:mm:ss" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "lumina-%{+YYYY.MM.dd}"
  }
}
```

## 6. 备份与恢复

### 6.1 数据库备份

```bash
# 全量备份
mysqldump -u root -p --databases lumina_config lumina_business > backup-$(date +%Y%m%d).sql

# 增量备份（启用二进制日志）
mysqlbinlog --start-datetime="2024-01-01 00:00:00" \
            --stop-datetime="2024-01-02 00:00:00" \
            mysql-bin.000001 > incremental-backup.sql

# 定时备份脚本
#!/bin/bash
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p --databases lumina_config lumina_business > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql
```

### 6.2 数据库恢复

```bash
# 恢复全量备份
mysql -u root -p < backup-20240115.sql

# 恢复增量备份
mysql -u root -p < incremental-backup.sql

# 恢复特定表
mysql -u root -p lumina_config < backup-20240115.sql --tables sys_module
```

### 6.3 Redis 备份

```bash
# 手动备份
redis-cli BGSAVE

# 查看备份文件
ls -la /var/lib/redis/dump.rdb

# 恢复备份
redis-cli SHUTDOWN
cp dump.rdb /var/lib/redis/
redis-server
```

## 7. 性能调优

### 7.1 JVM 调优

```bash
# 设置 JVM 参数
JAVA_OPTS="-Xms2g -Xmx4g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+ParallelRefProcEnabled \
  -XX:+UnlockDiagnosticVMOptions \
  -XX:G1SummarizeRSetStatsPeriod=1"

java $JAVA_OPTS -jar lumina-server-1.0.0.jar
```

### 7.2 数据库调优

```sql
-- 创建索引
CREATE INDEX idx_module_id ON sys_module_field(module_id);
CREATE INDEX idx_permission_module ON sys_permission_config(module_id);
CREATE INDEX idx_student_class ON student(class_id);
CREATE INDEX idx_score_student ON score(student_id);

-- 查询优化
EXPLAIN SELECT * FROM student WHERE class_id = 1;

-- 统计信息更新
ANALYZE TABLE student;
ANALYZE TABLE class;
ANALYZE TABLE score;
```

### 7.3 Redis 调优

```conf
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

## 8. 故障排查

### 8.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 连接超时 | 数据库不可达 | 检查网络连接和防火墙 |
| 内存溢出 | JVM 堆内存不足 | 增加 -Xmx 参数 |
| 查询缓慢 | 缺少索引 | 创建必要的索引 |
| 权限错误 | 用户权限不足 | 检查数据库用户权限 |

### 8.2 日志分析

```bash
# 查看错误日志
tail -f logs/lumina.log | grep ERROR

# 统计错误数量
grep ERROR logs/lumina.log | wc -l

# 查看特定时间段的日志
grep "2024-01-15 10:" logs/lumina.log
```

## 9. 升级与回滚

### 9.1 应用升级

```bash
# 1. 备份当前版本
cp target/lumina-server-1.0.0.jar backup/

# 2. 构建新版本
mvn clean package -DskipTests

# 3. 停止应用
kill $(lsof -t -i:8080)

# 4. 启动新版本
java -jar target/lumina-server-1.0.1.jar

# 5. 验证升级
curl http://localhost:8080/api/health
```

### 9.2 数据库升级

```bash
# 1. 备份数据库
mysqldump -u root -p lumina_config > backup-config.sql

# 2. 执行迁移脚本
mysql -u root -p lumina_config < migration-v1.0.0-to-v1.0.1.sql

# 3. 验证升级
SELECT VERSION FROM sys_version;
```

### 9.3 回滚操作

```bash
# 1. 停止应用
kill $(lsof -t -i:8080)

# 2. 恢复旧版本
cp backup/lumina-server-1.0.0.jar target/

# 3. 启动旧版本
java -jar target/lumina-server-1.0.0.jar

# 4. 恢复数据库
mysql -u root -p lumina_config < backup-config.sql
```

## 10. 总结

本文档提供了完整的部署和运维指南，包括：

1. **单机部署**：Docker 和本地部署
2. **集群部署**：Kubernetes 和负载均衡
3. **数据库初始化**：表结构和数据导入
4. **监控与日志**：应用监控和日志管理
5. **备份与恢复**：数据保护和灾难恢复
6. **性能调优**：JVM、数据库和 Redis 优化
7. **故障排查**：常见问题和解决方案
8. **升级与回滚**：版本管理和回滚策略

通过遵循本文档的指导，可以确保系统的稳定运行和高效维护。
