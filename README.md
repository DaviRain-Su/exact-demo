# exact-demo

一个用 [Exact](https://github.com/expo/exact) 写的待办清单。可以添加事项、勾选完成、删除，并看到还剩几件。

![网页上的待办清单：还剩 1 件，Buy milk 已勾选，Walk the dog 未完成](docs/todo-web.png)

## Exact 是什么

Exact 是 Expo 在做的跨平台应用运行时，目前还没到 1.0，接口每天都在变。界面用 Contract 写：一份声明式的界面描述，不写颜色和控件尺寸，各平台用自己的控件来画。数据逻辑用 TypeScript 或 Rust。同一份界面可以跑在网页、macOS、iOS 和 Linux 上。网页走浏览器自己的 DOM；原生端没有 WebView。

## 文件各管什么

| 文件 | 作用 |
| --- | --- |
| `app.contract` | 界面。输入框、添加按钮、列表、还剩几件，以及点击之后要调用的动作。它不自己改列表。 |
| `app.ts` | 待办存在内存里。Contract 来问列表，或让它添加、勾选、删除。刷新页面会清空，没有写磁盘。 |
| `app.test.contract` | 测试。自动输入、点击，再检查文字和列表是否还在。 |
| `app.json` | 应用名字（Todos）和包名。 |
| `exact.mjs` | `exact new` 生成的入口。命令实际在旁边的 Exact 仓库里。 |
| `docs/todo-web.png` | 网页宿主上的截图，由 Exact 的 agent 驱动拍下。 |

`app.contract.d.ts` 是编译时生成的类型，已在 `.gitignore` 里，不要手改。

## 用的 Exact 提交

`ef3e678b05a63688d033f391fc345a726e4b714f`

（`expo/exact` 的 main，提交说明：`upload.test.mjs's stand-in runtime has what admission.js now imports`。）

这个例子按该提交生成并测过。Exact 没有稳定 API，换一个提交可能编不过。

## 怎么运行

应用本身不包含 Exact 的源码。`exact.mjs` 默认去上一级目录的 `exact/` 找它（环境变量 `EXACT` 可以改这个路径）。

需要 Bun 1.4.2、rustup、Chrome。第一次 `setup` 会装固定版本的 Rust、Hermes、依赖，并拉取 Cargo 依赖，要几分钟。

把两个仓库放成同级目录：

```text
parent/
  exact/        # expo/exact，检出下面的提交
  exact-demo/   # 本仓库
```

```sh
git clone https://github.com/expo/exact.git ../exact
git -C ../exact checkout ef3e678b05a63688d033f391fc345a726e4b714f

# 安装 Bun 1.4.2（若还没有）。Exact 仓库 README 里的命令：
# curl -fsSL https://bun.sh/install | BUN_INSTALL=~/.bun-1.4.2 bash -s bun-v1.4.2

cd ../exact
bun scripts/exact.mjs setup

cd ../exact-demo
bun exact.mjs web          # 开发服务器，终端会打印地址
bun exact.mjs test web     # 编译网页包，再跑 app.test.contract
```

Exact 不在 `../exact` 时：

```sh
export EXACT=/你的路径/exact
```

直接用 Exact 仓库里的驱动脚本（先有一份对得上的网页包；`test web` 会自己编，单独的 `agent.mjs` 发现包过期会拒绝并提示先 `web-build`）：

```sh
cd "$EXACT"
EXACT_APP_DIR=/你的路径/exact-demo \
  bun scripts/agent.mjs web --app exact-demo --test /你的路径/exact-demo/app.test.contract
```

### 在 Mac 上

装好 Xcode 之后，在本仓库：

```sh
bun exact.mjs mac --run     # 本机 macOS 窗口
bun exact.mjs ios --run     # iOS 模拟器
bun exact.mjs test macos
bun exact.mjs test ios
```

第一次原生编译大概要十几分钟。iOS 模拟器只能在 macOS 上跑。

Linux 原生宿主（无窗口，编完再测；`test linux` 不会自己编译）：

```sh
bun exact.mjs linux
bun exact.mjs test linux
```

## 这次实际验证了什么

在一台 Linux 机器上验证过：

- `bun scripts/exact.mjs setup` 完成。网页需要的工具都在。iOS 交叉编译缺 Swift、Xcode SDK、LLVM 和 rcodesign，没有装。
- `bun exact.mjs contract build app.contract --json --errors-only` 输出 `[]`。
- `bun exact.mjs web-build` 成功，0 个警告。
- 网页测试通过。命令和输出：

```text
$ EXACT=/path/to/exact EXACT_APP_DIR=/path/to/exact-demo \
    bun /path/to/exact/scripts/agent.mjs web --app exact-demo \
    --test /path/to/exact-demo/app.test.contract
web: exact-demo served at http://127.0.0.1:43029/ (--port <n> or EXACT_PORT picks the port)
test "add, finish and delete": ok
1 passed, 0 failed
```

同一套步骤也通过了 `bun exact.mjs test web`（它先 `web-build`，再调用上面的 `scripts/agent.mjs`）。

截图用 agent 驱动拍的，视口 420×720：先添加 “Buy milk” 和 “Walk the dog”，再勾上第一条。见 `docs/todo-web.png`。

Linux 原生宿主也跑通了同一条测试。第一次 `bun exact.mjs linux` 会在 `app.json` 里记下 `host.linux`（所以现在的清单里有 linux）。这台机器上要先让 C++ 链接找得到标准库，否则编不过：

```text
CC=gcc CXX=g++ LIBRARY_PATH=/usr/lib/gcc/x86_64-linux-gnu/13 bun exact.mjs linux
```

原因：默认的 `c++` 是 clang，加上 `--target=x86_64-unknown-linux-gnu` 之后找不到 `<cassert>`；换成 g++ 之后，rust-lld 又找不到 `libstdc++`（它在 `/usr/lib/gcc/x86_64-linux-gnu/13/`，不在 lld 的默认路径里）。设好上面的变量后编译成功，然后：

```text
$ EXACT=/path/to/exact EXACT_APP_DIR=/path/to/exact-demo \
    bun /path/to/exact/scripts/agent.mjs linux --app exact-demo \
    --test /path/to/exact-demo/app.test.contract
test "add, finish and delete": ok
1 passed, 0 failed
```

`bun exact.mjs test linux` 的结果一样。Linux 宿主没有窗口，这次没有给它拍截图。

没有验证：

- macOS 和 iOS 模拟器。这台机器不是 Mac，也没有 iOS 模拟器。iOS 交叉编译需要的 Swift、Xcode SDK、LLVM、rcodesign 都没装。
