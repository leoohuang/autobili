# SCRIPT OUTLINE

## Suggested Title Options

1. Claude Code 实操上手：4 个场景教你真的拿它干活
2. 别再空聊了，Claude Code 正确干活流程
3. 我用 4 个真实任务，把 Claude Code 用法讲明白

## Thumbnail Copy Options

1. 直接开干
2. 4 个真实场景
3. 别只会聊天

## Target

- 平台：Bilibili
- 受众：已经会写代码、但还没把 Claude Code 真正用进工作流的人
- 时长：14-18 分钟
- 风格：高密度实操、边讲边演示、每一段都有可复制动作

## Core Promise

看完之后，观众不是“知道 Claude Code 很强”，而是能马上照着视频完成 4 件事：

1. 安装并进入第一个项目。
2. 用 Claude Code 快速看懂陌生代码库。
3. 用 Claude Code 从报错走到修复与验证。
4. 给 Claude Code 配上长期规则和安全边界。

## Opening

### Runtime

1 分钟

### Hook

大多数人把 Claude Code 用废掉，不是因为它不强，而是因为他们只会跟它聊天，不会拿它干活。今天这期不讲概念，直接讲 4 个你今天就能照着做的真实场景。

## Chapter 1

### Title

先装上，再进项目，别在空气里聊天

### Runtime

2.5-3 分钟

### Purpose

完成最小可用启动路径。

### Key Beats

- 安装方式：原生安装脚本优先，其次 Homebrew。
- 第一次登录：`claude` 后按提示，必要时用 `/login`。
- 进入真实项目目录再启动，不要空目录乱问。
- 先问 4 个基础问题建立地图。

### Commands

```bash
curl -fsSL https://claude.ai/install.sh | bash
brew install --cask claude-code
cd /path/to/project
claude
```

### First Prompts

- give me an overview of this codebase
- explain the main architecture patterns used here
- what are the key data models?
- where is the main entry point?

### Payoff

观众掌握第一种正确开局：先让 Claude Code 帮你建立项目地图。

## Chapter 2

### Title

场景一：接手陌生项目，10 分钟摸清核心路径

### Runtime

3-3.5 分钟

### Purpose

教观众快速理解代码结构和执行流。

### Key Beats

- 先找相关文件，再问这些文件怎么配合。
- 用业务语言提问，不要只说“帮我找代码”。
- 最后要求它 trace 一条完整链路。

### Demo Flow

1. `find the files that handle user authentication`
2. `how do these authentication files work together?`
3. `trace the login process from front-end to database`

### Payoff

观众知道 Claude Code 最值钱的一类活：找入口、串流程、压缩熟悉项目时间。

## Chapter 3

### Title

场景二：从报错到修复，不要一句“帮我修”

### Runtime

4-4.5 分钟

### Purpose

教观众怎样把 bug 修复流程拆成 Claude Code 擅长的顺序。

### Key Beats

- 先给复现命令和错误信息。
- 再让它先分析根因，别立刻改。
- 让它给多个修复方案，再选最保守的一个。
- 最后再让它执行并跑测试。

### Demo Flow

1. `I'm seeing an error when I run npm test`
2. 粘贴报错
3. `suggest a few ways to fix the @ts-ignore in user.ts`
4. `update user.ts to add the null check you suggested`
5. `run tests for the refactored code`

### Practical Rule

固定顺序：复现 -> 根因 -> 方案 -> 修改 -> 验证

### Payoff

观众拿到一套最实用的 bug 工作流，而不是一句模糊的“帮我修”。

## Chapter 4

### Title

场景三：重构和批量干活，Claude Code 怎么帮你提速

### Runtime

2.5-3 分钟

### Purpose

展示 Claude Code 适合做“规则明确但重复”的工程活。

### Key Beats

- 先让它找旧写法。
- 再让它解释怎么改更现代。
- 明确要求“行为不变”。
- 最后让它自己跑测试。

### Demo Flow

1. `find deprecated API usage in our codebase`
2. `suggest how to refactor utils.js to use modern JavaScript features`
3. `refactor utils.js to use ES2024 features while maintaining the same behavior`
4. `run tests for the refactored code`

### Payoff

观众理解 Claude Code 不是只会写 demo，更适合帮你扫工程债。

## Chapter 5

### Title

场景四：把规则和权限配好，不然早晚翻车

### Runtime

3-3.5 分钟

### Purpose

让观众学会长期可用的配置。

### Key Beats

- `CLAUDE.md` 负责项目规则，设置文件负责权限和行为。
- `/memory` 看当前加载了哪些记忆。
- `/status` 检查到底生效了哪些设置层。
- `.claude/settings.json` 里先把敏感文件挡掉。

### Config Snippets

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ]
  }
}
```

```md
# CLAUDE.md

- use pnpm, not npm
- run unit tests before proposing a commit
- do not edit files under generated/
```

### Commands

- `/memory`
- `/status`

### Payoff

观众知道怎么把 Claude Code 从“偶尔用一下”变成“长期能放心用”。

## Bonus

### Title

一个超好用的一次性玩法：把它当命令行工具接进脚本

### Runtime

1-1.5 分钟

### Demo Command

```bash
cat build-error.txt | claude -p 'concisely explain the root cause of this build error' > output.txt
cat code.py | claude -p 'analyze this code for bugs' --output-format json > analysis.json
```

### Payoff

观众理解 Claude Code 不只是交互式对话，还能塞进现有 shell 流程。

## Ending

### Closing Message

Claude Code 最容易用错的地方，是把它当聊天框。真正高效的用法，是把任务拆清楚，把上下文交完整，把修改和验证分开，把规则和权限提前配好。你一旦按这个方法用，它就会开始真正帮你干活。
