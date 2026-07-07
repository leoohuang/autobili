# 2026-07-07 每日自动迭代记录

## 改进摘要

**健壮性优化** — `lib/bilibili.ts` Semaphore 类从 busy-wait 轮询改为 promise-based FIFO 队列

---

## 改了什么

**文件**: `lib/bilibili.ts`

`Semaphore` 类负责限制 B 站字幕 API 的并发请求数（上限 5 个），在多 P 视频探测字幕时避免触发 IP 限流。

**原始实现（问题代码）**：
```typescript
class Semaphore {
  private running = 0;

  constructor(private readonly limit: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.limit) {
      this.running++;
      return;
    }
    const self = this;
    await new Promise<void>((resolve) => {
      const check = () => {
        if (self.running < self.limit) {
          self.running++;
          resolve();
        } else {
          setTimeout(check, 50); // ❌ busy-wait：每 50ms 轮询一次
        }
      };
      check();
    });
  }

  release(): void {
    this.running--;
  }
}
```

**问题**：
- `setTimeout(check, 50)` 是 busy-wait 轮询，50ms 间隔浪费 CPU
- 当大量请求堆积时，50ms 的不公平等待可能造成请求饥饿
- 逻辑上 slot 释放时不能立即 wake waiter，有 0~50ms 的人为延迟

**修复后（Promise FIFO 队列）**：
```typescript
class Semaphore {
  private running = 0;
  private waiters: Array<() => void> = [];

  constructor(private readonly limit: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.limit) {
      this.running++;
      return;
    }
    // 将 resolve 闭包放入队列，slot 释放时立即唤醒
    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  release(): void {
    if (this.waiters.length > 0) {
      // 唤醒最早的 waiter，由他们负责 increment
      const next = this.waiters.shift();
      next!();
    } else {
      this.running--;
    }
  }
}
```

**改进点**：
- ✅ 零 CPU 浪费：waiter 直接挂起，不轮询
- ✅ 零延迟唤醒：slot 释放时 next waiter 立即被 resolve
- ✅ FIFO 公平：严格按请求顺序服务，不会饥饿
- ✅ 逻辑正确：`running` 计数始终等于当前持有 slot 的任务数

## 为什么改

在 `probeSubtitles()` 中，所有视频分 P 的字幕探测并发运行，最多 5 个同时进行。当用户打开一个有 10+ P 的视频时：
- 旧实现：每 50ms 轮询一次，slot 释放后最多等 50ms 才能复用
- 新实现：slot 释放 → waiter 直接 resolve → 几乎零延迟复用

这不是功能性 bug，而是资源效率问题。虽然在 Vercel Serverless 环境中影响有限，但 Promise FIFO 队列是更标准、更正确的实现方式。

## 怎么改的

- 在 `Semaphore` 中引入 `waiters: Array<() => void>` 队列
- `acquire()` 在无法立即获得 slot 时，将 resolve 闭包 push 到队列
- `release()` 优先从队列中 pop 一个 waiter 来 resolve（而非 decrement running）
- 仅在 waiters 队列为空时才 decrement running
- 删除原有的 eslint disable 注释（不再需要 `no-this-alias`）
- `pnpm build` 编译通过 ✓

## 验证

```
pnpm build → ✓ Compiled successfully
```

## 提交

```
bfd70fc chore: replace busy-wait Semaphore with promise-based FIFO queue in bilibili.ts
```
