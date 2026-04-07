# FULL SCRIPT

## Title Options

1. Claude Code 实操上手：4 个场景教你真的拿它干活
2. 别再空聊了，Claude Code 正确干活流程
3. 我用 4 个真实任务，把 Claude Code 用法讲明白

## Thumbnail Copy Options

1. 直接开干
2. 4 个真实场景
3. 别只会聊天

---

如果你现在对 Claude Code 的理解，还停留在“一个待在终端里的 AI 聊天工具”，那你大概率已经把它用偏了。

因为 Claude Code 最值钱的地方，从来不是陪你空聊，而是直接进项目、读代码、跑命令、改文件、验证结果。

所以这期我不讲抽象概念，不讲谁比谁强，也不做大而空的功能盘点。

这期我们只做一件事。

我用 4 个真实开发场景，带你把 Claude Code 真正用起来。

看完以后你至少应该能马上上手 4 件事：

第一，装好 Claude Code 并进到真实项目里。
第二，用它快速看懂一个陌生代码库。
第三，用它从报错一路走到修复和验证。
第四，把记忆、规则和权限边界一次配好，避免后面越用越乱。

如果你要的是能干活的版本，这期就是给你的。

## 第一段：先装上，再进项目，别在空气里聊天

先说最基础的一步。

到 2026 年 3 月 23 日，Anthropic 官方 Quickstart 里给了几种安装方式。macOS、Linux、WSL 推荐原生安装脚本：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

如果你习惯 Homebrew，也可以直接：

```bash
brew install --cask claude-code
```

Windows 这边官方也给了 PowerShell 和 WinGet 入口，但今天我们重点讲通用工作流，所以先不展开。

装完以后，不要急着在任何目录里直接乱问。

先进入你真实要工作的项目目录：

```bash
cd /path/to/project
claude
```

第一次进去，它会要求你登录。官方文档的方式就是直接运行 `claude`，首次使用时按提示登录；如果后面要切换账号，就在交互里输入：

```text
/login
```

这里很多人第一步就错了。

他们启动成功之后，马上开始问：

“你能帮我做什么？”
“帮我优化整个项目。”

这种问题当然不是不能问，但它对你没有什么生产价值。

正确的第一轮提问，应该是先让 Claude Code 给你建立项目地图。你可以直接照着这 4 句问：

```text
give me an overview of this codebase
explain the main architecture patterns used here
what are the key data models?
where is the main entry point?
```

这一轮问完，你通常就已经拿到 4 个最关键的信息：

这个项目大致是干什么的。
主要技术栈是什么。
核心数据对象是谁。
代码入口从哪里开始。

你先别小看这一步。

很多人卡在 Claude Code 不好用，本质上不是它回答不出来，而是他们从来没建立过“先地图，后任务”的习惯。

你只有先让它理解现场，后面让它找问题、改代码，才会稳定。

## 第二段：场景一，接手陌生项目，10 分钟摸清核心路径

好，现在假设你刚接手一个项目，老板跟你说一句话：

“你先看一下登录这一块，下周要改。”

你最怕的是什么？

不是不会写，而是不知道这坨逻辑到底分散在哪。

这时候 Claude Code 最适合干的第一类活，就是找文件、串路径、讲交互。

你可以直接这样问：

```text
find the files that handle user authentication
```

这句话的价值在于，它比“帮我看登录逻辑”更可执行。

Claude Code 会先帮你把相关文件捞出来。文件出来以后，不要立刻让它改，而是追问第二层：

```text
how do these authentication files work together?
```

这个时候你要的不是代码逐行解释，而是模块关系图。

比如：

前端表单在哪。
提交请求进了哪个路由。
鉴权逻辑落在哪个 service。
数据库查用户发生在哪一层。

如果你还想再往前一步，把整条链路拉通，就问第三句：

```text
trace the login process from front-end to database
```

这个用法特别适合陌生项目。

因为你不是在让 Claude Code 替你写东西，你是在让它帮你压缩“熟悉上下文”的时间。

以前这个过程你可能要自己：

先 `rg` 搜关键词。
再开 6 个文件。
再手动脑补执行流程。

现在你可以先让 Claude Code 走第一遍，然后你再对着它给出的路径做抽查。

这里有个很实用的小原则。

问查找类问题时，尽量用项目里的业务语言，不要只说技术词。

比如你这个系统里不叫 authentication，而是叫 session、member login、staff sign-in，那你就应该直接用这些词。

Claude Code 找代码的时候，业务语言越贴近项目实际命名，命中率通常越高。

所以第一类真正能干活的用法，不是写代码，而是帮你快速认识项目。

这一步做好了，后面你修 bug 和做重构都会快很多。

## 第三段：场景二，从报错到修复，不要一句“帮我修”

接下来讲第二类最值钱的活，修 bug。

官方 Common Workflows 里给的思路很明确：先把错误交给 Claude，再要修复建议，最后再应用修改。

但很多人实际操作的时候，只有最后一步，没有前两步。

他们一上来就是一句：

“测试挂了，帮我修。”

这就是为什么结果经常漂。

你应该把 bug 流程拆成固定 5 步，我建议你以后就照这个顺序来：

第一步，给复现命令。
第二步，给错误信息。
第三步，让它分析根因。
第四步，让它列几个修法。
第五步，再指定一种方案执行并验证。

比如官方文档里的例子是：

```text
I'm seeing an error when I run npm test
suggest a few ways to fix the @ts-ignore in user.ts
update user.ts to add the null check you suggested
```

但我更建议你在真实使用时，把上下文再补完整一点。你可以直接这样说：

```text
I’m seeing an error when I run npm test.
Here is the full stack trace.
Please explain the root cause first, then give me 2-3 fix options.
Prefer the most conservative fix that keeps behavior unchanged.
```

等 Claude Code 把方案列出来之后，你不要贪快。

先看它给的 2 到 3 个方向是不是靠谱。

比如它可能会告诉你：

是空值判断漏了。
是类型太宽，靠 `@ts-ignore` 硬压过去了。
或者是测试 mock 和真实接口返回结构不一致。

你确认方案方向没问题以后，再下执行指令：

```text
update user.ts to add the null check you suggested
```

改完还没结束，最后一步必须补上验证：

```text
run tests for the refactored code
```

这一步特别关键。

因为 Claude Code 很擅长分析和修改，但你不能把“它改完了”直接等同于“这事结束了”。

一定要让它回到可验证结果。

能跑测试就跑测试。
能跑 lint 就跑 lint。
如果是前端问题，至少让它告诉你手动验证路径。

这里再补一个非常落地的习惯。

如果这个 bug 是稳定复现的，你就把复现步骤明确写出来。
如果它是偶发的，也告诉它“这个问题不是每次都会出现”。

官方文档也专门提醒了这点。

因为 Claude Code 判断问题时，非常依赖你给它的可复现性信息。

所以第二类能干活的用法，不是“把 bug 扔给 AI”，而是“把修 bug 流程拆给 AI”。

这个差别非常大。

## 第四段：场景三，重构和批量工程活，才是它最容易省时间的地方

很多人一说 AI 编程，就只想到“写新功能”。

但说实话，在日常开发里，Claude Code 可能更适合另一类活：

规则清楚、范围明确、重复度高的工程活。

比如老代码现代化。
比如批量改一类旧写法。
比如把一组 callback 风格逻辑改成 async/await。

官方文档给的重构套路也很实用，我给你直接翻成能干活的版本。

第一步，先让它找旧写法：

```text
find deprecated API usage in our codebase
```

第二步，让它告诉你怎么改更合适：

```text
suggest how to refactor utils.js to use modern JavaScript features
```

第三步，明确要求“行为不变”再动手：

```text
refactor utils.js to use ES2024 features while maintaining the same behavior
```

第四步，别忘了验证：

```text
run tests for the refactored code
```

为什么我一直强调“行为不变”这四个字？

因为你如果不说，Claude Code 有时候会顺手把风格、结构、甚至一部分逻辑判断一起改掉。

从代码审美上看也许更漂亮了，但从工程风险上看不一定更安全。

所以只要你是在扫工程债，而不是做需求重构，就把要求说死：

只改旧写法。
不要顺手改业务逻辑。
改完必须验证。

这一类活是 Claude Code 很容易拉开差距的地方。

因为它特别适合在一堆重复模式里先帮你定位，再给出成批修改建议，然后协助你一段段推进。

你把它用在这些地方，通常比让它凭空写一大坨新业务代码更稳。

## 第五段：场景四，把规则和权限配好，不然早晚翻车

如果你前面三段都能用起来，接下来最该做的不是追高级功能，而是先把长期配置配对。

这里你只要记住一句分工：

`CLAUDE.md` 管项目规则。
`settings.json` 管权限和行为。

先说 `CLAUDE.md`。

官方 memory 文档写得很清楚。每个 Claude Code 会话一开始都是新上下文，但有两种机制能把信息带到后续会话里：

第一种是你写的 `CLAUDE.md`。
第二种是自动记忆，也就是 auto memory。

`CLAUDE.md` 特别适合写那种“每次都得说一遍”的项目规则，比如：

```md
# CLAUDE.md

- use pnpm, not npm
- run unit tests before proposing a commit
- do not edit files under generated/
- prefer minimal diffs over broad rewrites
```

这类内容写进去以后，Claude Code 后面进这个项目时就更容易沿着同样的约束工作。

但注意，它不是圣旨。

它更像长期上下文，不是说你写了它，Claude Code 就一定百分百不会偏。

第二个你一定会用到的命令是：

```text
/memory
```

官方文档明确写了，你可以用它查看当前加载了哪些记忆文件。

这个命令很好用，因为很多时候你会怀疑：

我写的 `CLAUDE.md` 到底加载了没？
自动记忆到底记住了什么？

这时候 `/memory` 就能帮你确认。

再说权限。

如果你想长期放心用 Claude Code，一定要尽早配 `.claude/settings.json`。

官方 settings 文档里给的最重要示例，就是 `permissions.deny`。

比如你可以直接先放一版最基础的：

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

这是什么意思？

意思就是这些文件对 Claude Code 完全不可见。

不是“最好别读”，而是直接看不到。

这个设置非常关键，尤其是你在公司项目里工作的时候。

别等哪天让它顺手扫到了敏感配置，再后悔为什么一开始没挡住。

还有一个特别实用的命令：

```text
/status
```

官方文档说得很明确，`/status` 可以查看当前到底有哪些设置层在生效，以及它们来自哪里。

这在什么情况下有用？

比如你改了项目里的 `.claude/settings.json`，结果发现行为没变。
这时候你就可以用 `/status` 看是不是用户级设置、项目级设置，甚至更高优先级的策略把它覆盖掉了。

所以第四类真正能干活的用法，是把 Claude Code 从“偶尔进来帮一下”变成“有规则、有边界、能长期协作”的状态。

## 第六段：Bonus，用一次性命令把它塞进你现有 shell 流程

最后再给你一个我非常推荐的 bonus 用法。

Claude Code 不只是交互式会话，它还能作为一次性命令行工具塞进你现有的 shell 工作流。

官方文档给了一个很典型的例子：

```bash
cat build-error.txt | claude -p 'concisely explain the root cause of this build error' > output.txt
```

这个命令特别适合什么场景？

比如 CI 报错日志很长。
比如同事甩给你一份 build 输出。
比如你只想让 Claude Code 看这一份文本，不想开整个交互会话。

再比如你想要结构化输出，官方文档还支持 `--output-format json`：

```bash
cat code.py | claude -p 'analyze this code for bugs' --output-format json > analysis.json
```

这意味着你甚至可以把 Claude Code 接进自己的脚本里。

它不是只能坐在终端里聊天，也可以当成 shell 工具链的一环。

## 结尾

所以今天这期，如果你只带走 5 个动作，我希望是这 5 个。

第一，先进入真实项目，再启动 `claude`。

第二，第一次别急着改代码，先用 4 个基础问题把项目地图问出来。

第三，修 bug 时固定顺序：复现、根因、方案、修改、验证。

第四，做重构时把要求说死，尤其是“行为不变”。

第五，尽早配 `CLAUDE.md`、`/memory`、`.claude/settings.json` 和 `/status`，把长期规则和安全边界建起来。

Claude Code 最容易被用废的方式，就是一直跟它空聊。

而最值钱的方式，是把它放进真实项目、真实任务、真实验证流程里。

你一旦开始这样用，它就不再像一个聊天框，而是真的开始帮你干活。

---

## Fact Anchors

- 官方 Quickstart 在 2026 年 3 月 23 日可见的安装入口包括原生安装脚本、Homebrew、WinGet；首次运行 `claude` 会提示登录，也可用 `/login`。
- 官方 Common Workflows 给出了理解代码库、找相关文件、修 bug、重构、subagents、pipe in / pipe out 等实操流程。
- 官方 Memory 文档说明会话默认是新上下文，跨会话依靠 `CLAUDE.md` 和 auto memory；可用 `/memory` 查看记忆。
- 官方 Settings 文档说明 `.claude/settings.json` 等分层设置及 `permissions.deny`、`/status` 的用法。

## Source Links

- [Quickstart](https://code.claude.com/docs/en/quickstart)
- [Common workflows](https://code.claude.com/docs/en/tutorials)
- [Memory](https://code.claude.com/docs/en/memory)
- [Settings](https://code.claude.com/docs/en/settings)
