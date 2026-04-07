# 视频脚本逆向改写器

这是一个基于 Next.js 14 的极简 Web 应用，用来把一个 B 站视频的创作结构迁移到新话题上。用户输入视频链接和新话题后，系统会抓取原视频字幕，先做结构解构，再流式生成一份新的口播脚本。

当前版本已经包含字幕调试能力：你可以先验证某个 B 站链接有没有官方字幕、命中了哪一页、字幕列表里有哪些语言，再决定要不要进入正式生成。

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

没有配置 `OPENAI_API_KEY` 时，首页和字幕调试接口仍然可以使用；只是正式生成脚本会失败。

## 当前功能

- 首页输入 B 站链接和新话题，流式生成新脚本
- 自动解析常见 B 站输入形式：完整链接、带参数链接、直接输入 BV 号
- 自动尝试多分页视频的不同 `cid`，不是只盯第一页
- 首页内置“检查字幕”按钮，可直接查看字幕调试摘要和原始 JSON
- 提供独立调试接口，方便批量试 BV 号

## 字幕调试

### 首页调试

在首页填写视频链接后，点击“检查字幕”，页面会显示：

- 可读摘要：总页数、命中字幕页数、当前选中页、当前状态
- 原始调试 JSON：包括 `subtitle_list`、`page_attempts`、`resolved_bvid`、`final_url` 等字段

### 调试接口

你也可以直接请求：

```bash
GET /api/debug/subtitle?input=<视频链接或BV号>
```

或：

```bash
GET /api/debug/subtitle?bvid=<BV号>
```

返回内容包括：

- `input`
- `resolved_bvid`
- `resolve_source`
- `final_url`
- `title`
- `cid`
- `selected_page`
- `selected_part`
- `subtitle_list`
- `page_attempts`
- `first_subtitle_url`
- `transcript_preview`
- `transcript_length`
- `error`

## 已知限制

目前只支持有官方字幕的 B 站视频。
