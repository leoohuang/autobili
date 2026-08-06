# 2026-08-06 每日自动迭代

## 改进内容

**类型**: 健壮性修复（Bug 级别）
**文件**: `app/api/generate/route.ts`（+ `README.md`、`.env.local.example` 文档同步）

## 问题

`probeSubtitles()` 会返回**命中页里最长的那条字幕全文**，而 `/api/generate` 之前是把这个字符串
原封不动塞进 `PROMPT_A`：

```ts
const transcript = probe.transcript;
const analysisPrompt = buildAnalysisPrompt(transcript); // 全文，无任何长度上限
```

全代码库搜索 `MAX_TRANSCRIPT`、`truncat`、`context_length` 均无命中——**解构链路上没有任何一处
对字幕长度做过约束**。

### 为什么这是真问题，不是理论边界

`lib/openai.ts` 的 `OPENAI_MODELS` 白名单里同时列着这几个模型：

| 模型 | 上下文 | 大致能吃下的中文字幕 |
| --- | --- | --- |
| `gpt-4` | 8k tokens | ≈ 5k 字符就顶满 |
| `gpt-3.5-turbo` | 16k tokens | ≈ 12k 字符 |
| `gpt-4o` | 128k tokens | 3 小时长视频依然逼近上限 |

中文字符大约 1~1.5 token。这意味着：

- 用 `gpt-4`，**一个 20 分钟的视频**（约 6000 字字幕 ≈ 9k token）就已经超窗
- 用 `gpt-3.5-turbo`，一个 40 分钟视频就超
- 即使是 `gpt-4o`，公开课 / 纪录片 / 长访谈这类单 P 长视频（5 万字以上）也会顶到上限

### 失败时的用户体验

超窗后 OpenAI 返回 400 `context_length_exceeded`，落进 `OpenAI.APIError` 的兜底分支，
用户看到的是：

```
AI 服务错误 (400): This model's maximum context length is ...
```

而这一切发生在**链接解析 + 多分页字幕并发探测全部跑完之后**——用户白等了一整轮抓取，
最后拿到一句既看不懂、也不知道该怎么办的报错。同时这一次调用还会按超长输入计费。

## 怎么改的

### 1. 送进模型前先截断（主修复）

新增 `truncateTranscript()`，在 `probe.transcript` 流向 `buildAnalysisPrompt()` 的**唯一入口**处收口：

- 默认上限 `DEFAULT_MAX_TRANSCRIPT_CHARS = 24_000`，给 16k 模型留足 prompt 脚手架和 JSON 响应的余量
- 可通过 `MAX_TRANSCRIPT_CHARS` 环境变量覆盖，非法值（非整数 / < 1000）会 `console.warn` 并回退默认值
- **按句子边界切**（`。！？；… . ! ?` 和空格），不会把句子从中间劈开

### 2. 截断后告诉模型这是残篇

截断时在文本末尾追加 `TRUNCATION_NOTICE`，明确告知模型「这只是前段内容，不是完整视频」。
不加这句的话，模型会把截断后的字数当成真实 `total_words` 上报，还会把缺失的尾巴描述成「没有结尾」——
错误会一路传导到 `target_words`，让第二段生成的目标长度也跟着错。

### 3. 无标点字幕的兜底

B 站自动生成字幕经常**通篇没有标点**。如果无脑取「最后一个句号」，这类字幕会被砍到几乎不剩东西。
所以加了 `MIN_BOUNDARY_RATIO = 0.8`：只有当句子边界落在上限的 80% 之后才采纳，否则直接硬切到上限。

### 4. 超窗错误的兜底文案

即便有了上限，部署方仍可能调大 `MAX_TRANSCRIPT_CHARS`、或把 `OPENAI_MODEL` 指到更小的模型。
新增 `isContextLengthError()`（同时看 `error.code` 和 message 正则），命中时返回可执行的中文提示：

> 视频字幕太长，超出了当前模型的上下文长度。请换用上下文更大的模型（如 gpt-4o），或调小 MAX_TRANSCRIPT_CHARS 后重试。

## 验证

截断逻辑用独立脚本跑了 6 个边界用例，全部通过：

| # | 场景 | 结果 |
| --- | --- | --- |
| 1 | 短字幕（10 字） | 原样返回，`truncated=false` |
| 2 | 长且有标点（2600 字 → 上限 1000） | 切在句号上，末尾正好是「。」 |
| 3 | 长且**无标点**（5000 字） | 未坍缩，硬切到 1000 字 |
| 4 | 句子边界正好压在上限 | 正确取到 1000 |
| 5 | 标点极稀疏（边界在 101 位，< 800 阈值） | 正确回退硬切 |
| 6 | 长度恰好等于上限 | `truncated=false`，不误触发 |

`pnpm build` 编译通过（含类型检查）。

### 一个编译期插曲

首次构建报错：

```
Type error: 'OpenAI.APIError' refers to a value, but is being used as a type here.
```

openai v4 里 `OpenAI.APIError` 是挂在命名空间下的**类值**，不能直接当类型标注用
（`instanceof` 是可以的，所以原有代码没暴露这个问题）。改成 `InstanceType<typeof OpenAI.APIError>` 后通过。

## 影响面

- 长视频从「跑完全程再报天书」变成「正常出稿，只是基于前段内容解构」
- token 花销有了确定的上界，不再随视频长度线性膨胀
- `/api/debug/subtitle` **不受影响**：截断只发生在生成路由的消费点，调试接口仍然返回真实
  `transcript_length`，排查时看到的还是原始长度

## 没有一起改的（留给后续迭代）

- `targetWords` 目前没有上限（只校验 `<= 100000`）。5 万字的目标长度本身就不可用，
  但这属于输出侧的独立问题，混进来会破坏本次提交的原子性
- `maxDuration = 150` 小于「解构 60s + 生成 120s」的理论上限 180s，长任务仍可能被平台掐断
- `resolveBvidDetails` 用了 `redirect: "follow"`，SSRF 白名单只校验了首跳 URL，跳转后不再校验
