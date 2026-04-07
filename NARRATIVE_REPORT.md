# NARRATIVE REPORT

## Working Title

如何把 Claude Code 真正用起来：新手第一周上手路线

## Narrative Thesis

这条视频的核心观点不是“Claude Code 很强”，而是：

**Claude Code 的价值，不在于替你按下所有键，而在于它把理解代码、定位问题、提出改动、执行验证这些环节串成了一个可以在终端里协作的工作流。**

对多数开发者来说，真正的门槛不是安装，而是三件事：

1. 不知道该把它当什么来用。
2. 不知道怎样给它上下文，结果得到的回答很飘。
3. 不知道如何设置边界，所以要么完全不敢用，要么盲目信任。

## Audience Tension

目标观众处在一种很典型的夹层状态：

- 他们已经接受 AI 编程会成为日常工具。
- 他们也知道命令行代理和聊天窗口不是一回事。
- 但他们经常卡在“好像能做很多事，但我一上手就乱了”。

这条视频要解决的不是认知启蒙，而是使用路径混乱。

## What The Audience Actually Wants

观众真正想要的不是一堆术语，而是几个具体答案：

- 我应该从哪一步开始。
- 我该怎么描述任务，Claude Code 才不会乱猜。
- 它适合帮我做探索、修 bug、重构，还是只适合写小段代码。
- 我怎么避免把敏感文件和危险操作一起交出去。
- 它跟编辑器插件、网页聊天、别的 AI 编程工具到底有什么使用上的不同。

## Supported Framing From Official Docs

以下表述可以安全作为脚本锚点，来自 Anthropic 官方 Claude Code 文档：

1. 官方“Common Workflows”明确把 Claude Code 放在真实开发任务里讲，包括理解陌生代码库、找相关文件、修 bug、重构、跑测试、创建 PR、以 unix 风格进行 pipe in / pipe out 等。
2. 官方文档展示了它既可以从项目根目录启动，也强调先让它给出代码库概览，再逐步缩小到具体模块。
3. 官方文档单独说明了 `/memory`，用于查看当前会话加载了哪些记忆文件，并能管理自动记忆与 `CLAUDE.md` 指令。
4. 官方设置文档说明可以用 `~/.claude/settings.json`、`.claude/settings.json`、`.claude/settings.local.json` 做分层配置。
5. 官方设置文档说明可以用 `permissions.deny` 阻止 Claude Code 读取 `.env`、`secrets/**` 等敏感文件。
6. 官方“Common Workflows”也展示了 Plan Mode、subagents 以及把 Claude 当作命令行工具串入工作流的用法。

这些点足以支撑一条“如何用起来”的实操型脚本。这里的叙事重点应当是“怎么形成正确操作习惯”，而不是“穷举所有功能”。

## Best Story Shape

### Opening

从常见误区切入：

“很多人第一次打开 Claude Code，会把它当成一个会写 shell 命令的聊天机器人。但真正顺手的人，不是问得更多，而是更早学会怎么给上下文、怎么控边界、怎么把任务拆对。”

### Middle Build

中段按真实学习曲线推进：

1. 先理解它适合做什么。
2. 再演示第一次正确使用方式。
3. 再讲上下文和记忆怎么管。
4. 再讲权限和安全边界。
5. 最后讲怎样把它接进稳定工作流。

### Ending Payoff

结尾把价值上提一层：

“Claude Code 不会让你不需要理解代码，但它会放大你组织工作、表达问题、验证改动的能力。真正被替代的不是程序员，而是低质量、碎片化、无上下文的开发动作。”

## Angles To Avoid

- 避免做成“Claude Code vs 某某工具谁更强”的排行榜视频。
- 避免堆过多参数、安装细节和版本差异，导致主体节奏被技术细枝末节拖垮。
- 避免夸大为“自动开发神器”，否则可信度会崩。

## Proposed Chapter Logic

1. 为什么很多人知道 Claude Code，却始终没用顺。
2. 第一次上手时，应该把它当成什么工具。
3. 真正决定效果的，不是提示词花样，而是上下文质量。
4. 想长期使用，必须先学会权限和边界控制。
5. 当它接进日常开发流之后，你的工作方式会怎么变。

## Evidence And Example Strategy

由于这条视频是“使用方法”而不是“产品新闻”，不需要堆大量第三方数据。更有效的是用官方文档可验证的能力点，加上贴近开发者日常的问题场景。

推荐案例形态：

- 接手陌生项目，先问整体结构。
- 遇到测试报错，让它先解释根因，再提出几个修法。
- 做小型重构时，让它在保持行为一致的前提下重构并跑测试。
- 用 `.claude/settings.json` 或本地配置限制敏感文件读取。
- 用 `/memory` 管理长期偏好，比如始终使用某个包管理器或测试约定。

## Main Writing Constraint

整条脚本必须像一个有经验的开发者在带新人上手，而不是像文档目录朗读。语言要口语化，判断要克制，遇到能力边界时要明确提醒：

- Claude Code 会帮助你更快探索和执行。
- 但是否应该改、怎么验证、哪些文件不该碰，仍然需要人来定。

## Source Notes

- Anthropic Claude Code Docs, “Common Workflows”: https://code.claude.com/docs/pt/common-workflows
- Anthropic Claude Code Docs, “Memory”: https://code.claude.com/docs/it/memory
- Anthropic Claude Code Docs, “Settings”: https://code.claude.com/docs/es/settings
