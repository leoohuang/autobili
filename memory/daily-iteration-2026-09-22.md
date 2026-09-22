# Daily Iteration - 2026-09-22

## 执行摘要

按优先级（Bug 修复 > 健壮性 > 新功能 > 体验优化）在 `lib/bilibili.ts` 中修掉一处
「字幕轨选择」的正确性/健壮性问题。

## 改了什么

`probeSubtitles()` 在处理每一页字幕时，原来无条件取 `subtitles[0].subtitle_url`；
现在改为 **在可用字幕轨里优先选中文轨**，并跳过没有 `subtitle_url` 的占位轨。

新增两个模块内私有函数（`lib/bilibili.ts`）：

- `isChineseSubtitle(item)`：`lan` 含 `zh`（覆盖 `zh-CN` / `zh-Hans` / AI 的 `ai-zh`）
  或 `lan_doc` 含「中文」即视为中文轨。
- `pickPreferredSubtitle(subtitles)`：先过滤出 `subtitle_url` 非空的轨，再优先取中文轨，
  否则回退第一条可用轨，都没有则返回 `null`。

worker 中：

```ts
// Before
const attemptSubtitleUrl = attemptSubtitleList[0]?.subtitle_url ?? null;

// After
const chosenSubtitle = pickPreferredSubtitle(attemptSubtitleList);
const attemptSubtitleUrl = chosenSubtitle?.subtitle_url ?? null;
```

## 为什么改

B 站播放器接口返回的是作者挂上的**全部**字幕轨，数组顺序不保证符合我们的偏好。
盲目取 `[0]` 有两个真实故障：

1. **选错语言**：带多语言 CC 的视频里第一条可能是 `en-US`。而解构 Prompt（PROMPT_A）
   和新脚本（PROMPT_B）都是中文语境，用英文字幕解构会得到错误的结构骨架，并让
   `total_words` 估算失真，最终新脚本长度也不对。
2. **误报“无字幕”**：第一条可能是没有可用 `subtitle_url` 的占位轨（锁定轨，或仍在
   生成的 AI 字幕）。原代码 `[0]?.subtitle_url` 得到 `null`，于是整页被判为无字幕，
   即便后面某条轨其实有 URL —— 用户会看到「该视频没有字幕，暂不支持」的误报。

## 怎么改的

1. 新增 `isChineseSubtitle` / `pickPreferredSubtitle` 两个纯函数，逻辑内聚、无副作用，
   放在 `normalizeSubtitleUrl` 之后。
2. worker 改用 `pickPreferredSubtitle` 选轨；`bestSubtitleList` 仍保留完整列表，
   调试面板展示的字幕信息不变。
3. 行为保持向后兼容：没有中文轨时回退到第一条可用轨，与旧行为一致；没有可用轨才返回
   `null`（旧逻辑此时也是 null）。
4. README「当前功能」补充一条说明。

## 构建验证

- `pnpm install`: ✅ 通过（lockfile up to date）
- `pnpm build`: ✅ Compiled successfully，无类型错误（`/api/generate`、`/api/debug/subtitle`
  均正常编译）

## 备注：本机 git 环境

系统 `/usr/bin/git` 仍被 Xcode license 阻塞（exit 69），本次沿用
`/Applications/Xcode.app/Contents/Developer/usr/bin/git` 完成 pull/add/commit/push。
