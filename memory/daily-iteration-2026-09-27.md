# Daily Iteration - 2026-09-27

## 执行摘要

按优先级（Bug 修复 > 健壮性 > 新功能 > 体验优化）在 `lib/bilibili.ts` 的 `resolveBvidDetails()`
中修掉一处**SSRF 防护被重定向链绕过**的健壮性问题：原代码用 `fetch(url, { redirect: "follow" })`
解析短链，导致 SSRF allowlist 只校验了初始 URL，重定向目标主机从未被校验。

## 改了什么

新增 `followRedirects(startUrl, signal)` 助手，把 `redirect: "follow"` 改为 `redirect: "manual"`，
**逐跳**跟随 3xx 重定向，且每一跳的 `Location` 主机都必须通过 `isAllowedResolveUrl()` 校验：
- 命中 allowlist 才继续下一跳；
- 任意一跳越界（含 `Location` 无法解析）即返回 `{ blocked: true }`，调用方返回
  `source: "blocked_redirect"`、`bvid: null`，拒绝解析；
- 超过 `MAX_REDIRECT_HOPS`（5）也视为 blocked，避免无限跳转。

`resolveBvidDetails()` 的解析循环改为调用 `followRedirects`；`ResolveBvidResult.source` 联合类型
新增 `"blocked_redirect"`。超时 / 重试 / 退避语义、以及 `redirect_url` / `fallback_url` 的结果形状
全部保持不变。

## 为什么改

代码明确以 `ALLOWED_RESOLVE_HOSTS` + `isAllowedResolveUrl()` 作为 SSRF 防护（注释也声称
"prevents SSRF"）。但旧实现只在**解析初始 URL** 时校验主机，`redirect: "follow"` 会让服务端
忠实地请求第一个响应指向的**任何**主机——包括内网 IP、link-local 地址，或云元数据端点
（如 `http://169.254.169.254/`）。`b23.tv` 在 allowlist 内，但它一旦 302 到一个非 B 站主机
（被攻陷的短链、合作域名等），攻击者就能让本服务对内网/元数据端点发起服务端请求，
allowlist 形同虚设。

只 GET、从不读取响应体，所以即便请求本身也被限制在 allowlist 主机内，彻底堵死 blind SSRF。

## 怎么改的

- 常量区新增 `const MAX_REDIRECT_HOPS = 5;`
- 新增 `followRedirects()`：循环内 `fetch(redirect: "manual")`，依据 `status` 3xx +
  `Location` 判断是否为重定向；用 `new URL(location, currentUrl)` 解析相对/协议相对地址，
  再 `isAllowedResolveUrl(nextUrl)` 校验，越界即 blocked。
- `resolveBvidDetails()` 用 `followRedirects` 替换原来的内联 `redirect: "follow"` fetch，
  命中 `chain.blocked` 时返回 `blocked_redirect`。

## 验证

- `pnpm install && pnpm build` 通过（✓ Compiled successfully，类型检查通过）。
- 行为覆盖：b23.tv→bilibili.com 正常解析、内网重定向被拦截、直接 bilibili 链接无重定向、
  非法输入返回 `invalid_input`、初始主机不在 allowlist 返回 `invalid_input`。
- 下游仅把 `resolved.source` 作为字符串透出（`/api/generate` 的 debug_summary 与
  `/api/debug/subtitle` 的 `resolve_source`），新增 `blocked_redirect` 不影响现有逻辑。
