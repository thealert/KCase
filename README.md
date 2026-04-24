# KCase

<p align="center">
  <img src="doc/kcase_info.png" alt="poster" width="960" />
</p>

## 项目结构

- `casemind_front`：前端项目，基于 `Umi 2 + React`
- `casemind_backend`：后端项目，基于 `Spring Boot 2.1.8 + Maven`

建议按以下顺序启动：

1. 安装&启动MySQL（建议 5.7） ，创建数据库 mycase_manager，利用sql中的脚本配置对应表。创建表脚本路径：casemind-backend/sql/case-manager.sql
2. 检查并补齐 casemind-backend/src/main/resource `application-dev.properties` 中的数据库账号密码
3. 启动后端 cd casemind-backend && mvn spring-boot:run
4. 启动前端 cd casemind-front && npm install && npm run start
5. ai生成能力（支持openai通用接口调用），配置casemind-backend/src/main/resource `application-dev.properties`下的

ai.openai.base-url=
ai.openai.api-key=
ai.openai.model-name=

## 环境要求

### 前端

- Node.js（`package.json` 中声明为 `>=12.0.0`）
- npm

### 后端

- JDK 1.8
- Maven
- MySQL

## 前端构建与启动

前端目录：

```bash
cd casemind_front
```

安装依赖：

```bash
npm install
```

开发启动：

```bash
npm start
```

生产构建：

```bash
npm run build
```

## 后端构建与启动

后端目录：

```bash
cd casemind_backend
```

开发启动：

```bash
mvn spring-boot:run
```

打包：

```bash
mvn clean package -DskipTests
```

打包后运行：

```bash
java -jar target/mycasemind-webapp.jar
```

## 后端依赖配置

### MySQL

开发环境连接配置位于 `application-dev.properties`：

- 地址：`127.0.0.1:3306`
- 数据库：`mycase_manager`
- 用户名：`root`
- 密码：需要按本地环境填写



## 功能界面预览

### 1. 用例管理

用于查看用例列表、状态流转、创建人和操作入口，支持从列表页快速进入执行、编辑和维护流程。

<p align="center">
  <img src="doc/1.用例管理.png" alt="用例管理" width="960" />
</p>

### 2. 用例编辑

提供脑图式的测试用例编辑能力，支持节点拆分、标签管理、优先级标记和结构化维护，适合复杂场景下的测试设计。

<p align="center">
  <img src="doc/2.用例编辑.png" alt="用例编辑" width="960" />
</p>

### 3. 用例执行

支持执行视图下的用例流转与结果记录，可结合通过率、执行进度和节点状态进行实时跟踪。

<p align="center">
  <img src="doc/3.用例执行.png" alt="用例执行" width="960" />
</p>

### 4. 用例 AI 生成

内置 AI 辅助能力，可围绕当前节点或业务场景补充测试点、生成用例内容，并辅助测试设计完善。

<p align="center">
  <img src="doc/4.用例AI生成.png" alt="用例AI生成" width="960" />
</p>

### 5. 历史备份

支持查看历史备份记录，便于回溯不同版本的编辑结果，满足追踪、审计和恢复场景。

<p align="center">
  <img src="doc/5.历史备份.png" alt="历史备份" width="960" />
</p>

### 6. 多主题支持

支持浅色与深色等多主题界面切换，方便在不同使用场景下获得更舒适的视觉体验。

<p align="center">
  <img src="doc/6.多主题支持.png" alt="多主题支持" width="960" />
</p>


用例编辑基础能力基于 [AgileTC](https://github.com/didi/AgileTC) 项目