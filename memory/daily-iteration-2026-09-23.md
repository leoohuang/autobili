# Daily Iteration - 2026-09-23

## 执行摘要

按优先级（Bug 修复 > 健壮性 > 新功能 > 体验优化）在 `app/api/generate/route.ts` 中修掉一处
错误处理语义不正确的健壮性问题：请求体不是合法 JSON 时，应返回 400 而非泛化的 500。

## 改了什么

`POST /api/generate` 现在对 `await request.json()` 单独加了一层 try/catch。若请求体不是
合法 JSON，直接返回：

```json
{ "error": "BAD_REQUEST", "message": "请求体不是合法的 JSON，请检查输入后重试" }
```

HTTP 状态码 400；其余逻辑不变。

## 为什么改

原来 `request.json()` 直接写在 `POST` 的大 try 块里，没有专属的守卫。一旦请求体是非法 JSON，
`request.json()` 会抛错并一路落到最外层 catch，最终返回泛化的：

```json
{ "error": "INTERNAL_ERROR", "message: "生成失败，请稍后重试" }
```

状态码 500。

问题在于：请求体格式错误是**客户端**问题，语义上应该归为 4xx（BAD_REQUEST），而不是 5xx
（服务器内部错误）。这与本路由里所有其他输入校验（缺 url/topic、url 过长、topic 长度非法、
encodeURIComponent 失败等）都返回 400 的约定不一致——它们都在 `request.json()` 之后，唯独
"JSON 解析失败" 这个更靠前的校验被遗漏了，反而给出最不准确的错误。

## 怎么改的

在解析请求体处插入内层 try/catch：

```ts
let body: { url?: string; topic?: string };
try {
  body = (await request.json()) as { url?: string; topic?: string };
} catch {
  return Response.json(
    { error: "BAD_REQUEST", message: "请求体不是合法的 JSON，请检查输入后重试" },
    { status: 400 },
  );
}
```

- 内层 catch 命中即 `return`，不会落到外层 catch，保证返回的是明确可定位的 400。
- 正常路径（合法 JSON）行为完全不变；前端始终发送合法 JSON，所以线上无感知影响。
- 改动局部、原子，未触碰任何其他逻辑，编译（`pnpm build`）通过，类型检查通过。

## 构建验证

- `pnpm install`: ✅ 通过（lockfile up to date）
- `pnpm build`: ✅ Compiled successfully，无类型错误（`/api/generate`、`/api/debug/subtitle` 均正常编译）

## 备注：本机 git 环境

系统 `/usr/bin/git`（实际是 Xcode 许可门控的 shim）仍被未接受的 Xcode license 阻塞
（`sudo xcodebuild -license` 需要密码，无法自动完成）。本次沿用
`/Library/Developer/CommandLineTools/usr/bin/git` 完成 pull / add / commit / push，全部成功。

## 提交

`20dea98` chore: daily auto-iteration - return 400 instead of 500 for malformed JSON request body in /api/generate
（f8c5245..20dea98  main -> main，已推送）
