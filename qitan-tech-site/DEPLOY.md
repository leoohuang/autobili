# 启探科技官网部署说明

## 当前能力

- 前台官网：品牌首页、博客、视频、服务、会员入口
- 后台能力：管理员发布博客、发布视频
- 会员能力：注册、登录、个人中心
- 数据库：SQLite（开发期方便落地）

## 本地启动

```bash
npm install
cp .env.example .env
npx prisma db push
node --env-file=.env prisma/seed.mjs
npm run dev
```

## 生产环境建议

### 方案 A：VPS + Node.js

1. 安装 Node.js 20+
2. 上传项目代码到服务器
3. 设置 `.env`
4. 执行：

```bash
npm install
npm run build
npx prisma db push
node --env-file=.env prisma/seed.mjs
npm run start
```

建议配合 Nginx 反向代理与 HTTPS。

### 方案 B：Docker 部署

```bash
docker build -t qitan-tech-site .
docker run -d \
  -p 3000:3000 \
  --name qitan-tech-site \
  -e JWT_SECRET="replace-with-a-long-random-secret" \
  -e DATABASE_URL="file:/app/prisma/dev.db" \
  qitan-tech-site
```

## 生产环境建议的下一步

- 把 SQLite 升级为 PostgreSQL
- 增加富文本编辑器
- 增加课程、支付和会员权限分层
- 接入对象存储上传封面与视频素材
- 接入邮件通知与企业咨询表单

## 默认管理员

- 邮箱：`admin@qitantech.com`
- 密码：`Qitan2026!`

首次上线后请立即修改。
