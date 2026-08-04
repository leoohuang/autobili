# 2026-08-04 每日自动迭代

## 改进内容

**类型**: Bug 修复（最高优先级）
**文件**: `lib/bilibili.ts`（+ `README.md` 文档同步）

## 问题

`extractBvid()` 的正则是：

```ts
const BVID_PATTERN = /BV[0-9A-Za-z]+/i;
```

这个模式有三个缺陷叠加：

1. **大小写不敏感**（`i` 标志）→ `bv` 也算命中
2. **没有长度上限**（`+`）→ 能吞掉任意长的字母数字串
3. **没有单词边界** → 可以从任意 token 中间开始匹配

三者叠加导致：**当 BV 号出现在查询参数里时，正则匹配的是参数名而不是参数值。**

```
https://www.bilibili.com/list/watchlater?bvid=BV1GJ411x7h7&oid=123
                                         ^^^^
                       "bv"(忽略大小写) + "id"  →  extractBvid() 返回 "bvid"
```

`resolveBvidDetails()` 拿到 `"bvid"` 后走 `direct_match` 分支直接返回，
`probeSubtitles("bvid")` 用这个垃圾 id 去打 B 站接口，用户看到的是
`BILIBILI_API_ERROR(-400)`，而不是脚本。

**影响面**：所有把 BV 号放在 query 里的 B 站 URL **100% 失败**，包括：

- 稍后再看：`/list/watchlater?bvid=...`
- 收藏夹列表播放：`/list/ml3355879?bvid=...&oid=...`
- 老版 medialist：`/medialist/play/watchlater?bvid=...`

这些都是很常见的粘贴来源——用户从「稍后再看」里复制链接是主流操作之一。
更糟的是失败信息具有误导性：报的是 B 站 API 错误，让人以为是视频有问题，
实际是本地解析就已经错了。

## 修复

BV 号的真实格式是 `BV` + **恰好 10 个**字母数字字符，且不会嵌在更长的
字母数字 token 中间。据此收紧正则：

```ts
const BVID_PATTERN = /(?:^|[^0-9A-Za-z])(BV)([0-9A-Za-z]{10})(?![0-9A-Za-z])/i;

export function extractBvid(input: string): string | null {
  const match = input.match(BVID_PATTERN);
  if (!match) return null;
  return `BV${match[2]}`;
}
```

三点设计取舍：

- **前边界用 `(?:^|[^0-9A-Za-z])` 而非 lookbehind `(?<!...)`**：语义等价，但
  避免 lookbehind 在老旧 JS 运行时上抛解析期语法错误的风险。
- **`BV` 前缀保持大小写不敏感，并归一化为大写**：用户确实会手打 `bv1...`，
  顺手修好了这个 case；后 10 位原样保留（BV 号本体大小写敏感）。
- **精确 `{10}`**：这是 B 站 BV 号的既定格式（总长 12 字符），
  也正是它让 `bvid=` 不再误命中——`"bv" + "id=BV1GJ41"` 里有 `=`，凑不满 10 位。

## 验证

把 `lib/bilibili.ts` 用 `typescript.transpileModule` 转成 ESM 后逐用例回归：

| 输入 | 修复前 | 修复后 |
| --- | --- | --- |
| `/list/watchlater?bvid=BV1GJ411x7h7&oid=123` | ❌ `bvid` | ✅ `BV1GJ411x7h7` |
| `/list/ml3355879?bvid=BV1GJ411x7h7&oid=987` | ❌ `bvid` | ✅ `BV1GJ411x7h7` |
| `/medialist/play/watchlater?bvid=BV1GJ411x7h7` | ❌ `bvid` | ✅ `BV1GJ411x7h7` |
| `bv1GJ411x7h7` | ⚠️ `bv1GJ411x7h7` | ✅ `BV1GJ411x7h7` |
| `/video/BV1GJ411x7h7` | ✅ | ✅ |
| `/video/BV1GJ411x7h7/?share_source=copy_web` | ✅ | ✅ |
| `/m.bilibili.com/video/BV1GJ411x7h7?buvid=XY123` | ✅ | ✅ |
| `看看这个 BV1GJ411x7h7，很有意思` | ✅ | ✅ |
| `【标题-哔哩哔哩】 https://b23.tv/8kNq2Xv` | ✅ null（走短链解析） | ✅ 不变 |
| `/video/av123456` | ✅ null | ✅ null |
| `space.bilibili.com/123?tab=bvid` | ⚠️ `bvid` | ✅ null |
| `/video/BV1GJ411x7h7EXTRA` | ⚠️ 越界吞并 | ✅ null → 回退到重定向解析 |

回归项：
- `resolveBvidDetails('/list/watchlater?bvid=BV1GJ411x7h7&oid=123')`
  → `{bvid:"BV1GJ411x7h7", source:"direct_match"}` ✓
- SSRF 白名单未削弱：`http://169.254.169.254/latest/meta-data/`
  仍返回 `invalid_input`，不发起任何请求 ✓
- `pnpm build` → ✓ Compiled successfully

## 附带

`README.md` 的「自动解析常见 B 站输入形式」补上了稍后再看/收藏夹这一类
查询参数链接，保持文档与实际能力一致。
