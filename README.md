# 视频脚本逆向改写器

这是一个基于 Next.js 14 的极简 Web 应用，用来把一个 B 站视频的创作结构迁移到新话题上。用户输入视频链接和新话题后，系统会抓取原视频字幕，先做结构解构，再流式生成一份新的口播脚本。

## 安装运行

```bash
pnpm install
pnpm dev
```

启动后访问 `http://localhost:3000`。

## 环境变量

复制 `.env.local.example` 为 `.env.local`，并填入：

```bash
OPENAI_API_KEY=sk-xxx
```

## 已知限制

目前只支持有官方字幕的 B 站视频。
