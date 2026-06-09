# 2026-06-08 每日迭代

## 改进摘要

**Bug修复** - `app/api/generate/route.ts` 中的错误匹配逻辑

### 改了什么
将 `error.message === "EMPTY_ANALYSIS"` 和 `error.message === "INVALID_ANALYSIS_JSON"` 改为使用 `startsWith()` 前缀匹配。

### 为什么改
代码中使用 `throw new Error("INVALID_ANALYSIS_JSON: ...")` 抛出的错误消息是带后缀的（如 `INVALID_ANALYSIS_JSON: {"total_words":...}`），但错误匹配逻辑使用 `===` 精确匹配，导致无法匹配到带后缀的错误消息。用户遇到分析结果格式异常时无法获得友好的错误提示。

### 怎么改的
- 使用 `error.message.startsWith("EMPTY_ANALYSIS")` 替代 `===` 精确匹配
- 使用 `error.message.startsWith("INVALID_ANALYSIS_JSON")` 替代 `===` 精确匹配
- 编译验证通过
- 已推送到 main 分支