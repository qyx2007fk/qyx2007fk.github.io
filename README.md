# qyx的妙妙屋

> 一间装着奇思妙想的小屋。小游戏、照片墙、实用工具、个人收藏，都会慢慢搬进来。
>
> **线上地址：<https://qyx2007fk.github.io/>**

纯静态站点：**没有构建步骤，没有框架，没有 npm 依赖**。HTML / CSS / 原生 JS 手搓，改完推到 `main` 就自动更新。

## 找到 qyx

- QQ：`1545648604`（网站上点 QQ 号可以直接复制）
- B站：<https://space.bilibili.com/495846524>
- GitHub：<https://github.com/qyx2007fk>

## 屋子里有什么

| 房间 | 现在 | 以后 |
| --- | --- | --- |
| **游戏厅** | 已开门，两款小游戏在线 | 继续做新的小游戏 |
| **照片墙** | 已开门，可以上传照片 | 随手拍的照片、想记住的瞬间 |
| **工具间** | 准备中，先把位置留出来 | 格式转换、图片处理、日常小按钮…… |
| **收藏柜** | 准备中，第一格还空着 | 书、音乐、网站、图片、奇怪的小东西 |

四个房间是**并列关系**，都挂在首页的「房间目录」里；想加第五类，照着 `.room-card` 再复制一张即可。

游戏厅现在收录：

- 零号实验区 · LAB ZERO：<https://qyx2007fk.github.io/lab-zero/>
- 卡通大乱斗 · TOON BLASTER（你说的 blast）：<https://qyx2007fk.github.io/toon-blaster/>

## 照片墙怎么用

照片墙在 **<https://qyx2007fk.github.io/gallery.html>**。

照片列表上方可以切换 **最新在前 / 最早在前**，按上传时写入照片文件的时间排序；选择会记住，也可以用 `?sort=asc` 或 `?sort=desc` 分享特定顺序。

### 上传照片（屋主）

1. 打开照片墙，点「上传照片」进入 **<https://qyx2007fk.github.io/upload.html>**。
2. 第一次用，先创建一枚 **Fine-grained GitHub token**：
   - 打开 <https://github.com/settings/personal-access-tokens/new>
   - Token name 随便写，Expiration 建议选 7 天或 30 天
   - **Repository access** → `Only select repositories` → 只勾 `qyx2007fk.github.io`
   - **Repository permissions** → `Contents` → `Read and write`（Metadata 会自动是 Read）
   - 生成后复制 `github_pat_...`，回到上传页粘贴，点「保存并验证」
3. 点选照片，或直接把照片拖进虚线框。手机上会打开相机 / 相册。
4. 可以给每张照片写一句说明（可选），点「上传到照片墙」。
5. 照片会在浏览器里自动压到最长边 2200px、JPEG 质量 86%，然后提交到 GitHub。
6. GitHub Pages 大概需要 **1 分钟**构建，之后刷新照片墙就能看到。

一次最多 20 张；单张超过 30MB 会被跳过。

### 删照片（屋主）

- 照片墙页面点「管理照片 / 删除」，或直接打开 <https://qyx2007fk.github.io/upload.html#manage>
- 连接同一枚 token 后，会列出照片墙上的所有照片（最新在前）
- 勾选传错的照片 →「删除所选」→ 确认
- 会同时移除照片文件、更新 `gallery/index.json`，并提交到 GitHub；GitHub Pages 约 1 分钟后更新
- Git 历史里仍可能保留被删照片的记录；如果照片敏感，需要在仓库层面重写历史

### token 存在哪

- token 只保存在**当前浏览器**：默认 `sessionStorage`；勾选「记住这台设备」后存 `localStorage`。
- token **不会**写进网站、不会提交到仓库、不会发给 GitHub 以外的任何地方。
- 页面在 `upload.html`，加了 `noindex`；但页面本身是公开的，**没有 token 的人不能上传**。
- token 只给这个仓库的 `Contents` 读写权限，建议设置过期时间。泄露了立刻去 GitHub 删除。
- 上传的照片会**公开**显示在照片墙，也会存进这个公开仓库；不要传私人照片。

### 照片存在哪

```text
gallery/
├── index.json          # 照片清单（文件名、说明、日期、尺寸）
└── photo-....jpg       # 压缩后的照片
```

照片墙读取 `gallery/index.json` 渲染。想删照片：用上传页的「管理照片」，或者手动删除图片并更新 `index.json`。

## 页面结构

1. **首页 `index.html`**
   - 首屏：屋名 + 两张游戏拍立得 + 开灯 / 关灯
   - 房间目录：游戏厅、照片墙、工具间、收藏柜四张并列卡片
   - 小游戏：两款游戏 + 「GAME 03 还在做」
   - 实用工具：空状态，预留工具墙
   - 个人收藏：空状态，预留收藏柜
   - 关于：**网站简介** + 屋主 qyx
   - 敲门：GitHub + 复制本页链接
   - 彩蛋：依次敲 `qyx` 会下星星雨
2. **照片墙 `gallery.html`**：瀑布流 + 灯箱（键盘 ← → / Esc、手机左右滑），可按文件时间正序 / 倒序
3. **上传页 `upload.html`**：token 连接、选照片、压缩、提交、管理 / 删除照片
4. **404 `404.html`**：走错房间时的小提示

## 本地预览

```bash
cd qyx-wonder-room
python3 -m http.server 4173
```

然后打开 <http://127.0.0.1:4173/>。

> 直接双击 `index.html` 也能打开，但个别浏览器会限制 `file://` 下的字体加载，照片墙的 `fetch` 也需要 http 环境，建议用本地服务。

## 想改点什么

| 想改的内容 | 去哪里改 |
| --- | --- |
| **网站简介** | `index.html` 搜索「网站简介」，改 `blockquote` 里那两段 `<p>` |
| 两个游戏的链接、卡片文案 | `index.html`（搜索 `qyx2007fk.github.io`） |
| 照片墙标题、介绍 | `gallery.html` |
| 上传页说明、token 帮助 | `upload.html` |
| 房间目录的标题、介绍 | `index.html` 的 `#rooms` 区域 |
| 工具间 / 收藏柜的空状态 | `index.html` 的 `#tools` / `#collection` 区域 |
| 配色、字号、间距 | `styles.css` / `gallery.css` 顶部的变量 |
| 星空、倾斜、彩蛋等交互 | `app.js`；照片墙逻辑在 `gallery.js` / `upload.js` |
| 游戏截图 | 替换 `assets/*.webp`，保持 1200×750（16:10） |
| 社交分享封面 | `assets/og-cover.png`（1200×630） |

## 以后怎么往里加东西

### 加一款新游戏

复制小游戏区里任意一张 `.game-card`，改链接、截图、`alt`、标题、描述和标签；再把「房间目录」里游戏厅的「2 款已上线」改成实际数量。

### 工具 / 收藏有内容了

把对应的 `.empty-room` 空状态整块换成一个或多个内容卡片。工具建议保留 `#tools` 的标题，收藏建议保留「收藏柜、一个格子放一件」的说法。不确定排版就直接把素材丢给我。

### 照片墙

上传页已经处理好「压图 + 提交 + 更新清单」，平时不需要手动改 `gallery/index.json`。传错的照片可以在上传页底部「管理照片」里勾选删除，也可以直接改仓库里的 `gallery/` 和 `index.json`。

### 加一个新房间

1. 在「房间目录」里复制一张 `.room-card`，改 `data-room`、编号、标题、描述和 `href`；
2. 下面复制一个同级别 section，改 `id`、编号和内容；
3. 导航、后面的编号顺延。

## 部署

站点已经部署在 **<https://qyx2007fk.github.io/>**（仓库：`qyx2007fk/qyx2007fk.github.io`，`main` 分支根目录，GitHub Pages 自动构建）。

以后更新：

```bash
cd qyx-wonder-room
git add .
git commit -m "更新妙妙屋"
git push
```

等一两分钟线上自动更新。换域名或改成子路径时，记得同步改 `canonical`、`og:image`、`twitter:image`；换域名再加一个 `CNAME` 文件。

## 文件结构

```text
qyx-wonder-room/
├── index.html              # 首页
├── gallery.html            # 照片墙
├── upload.html             # 上传页（屋主）
├── 404.html                # 走错房间
├── styles.css              # 全站样式
├── gallery.css             # 照片墙 / 上传页样式
├── app.js                  # 星空、主题、滚动、彩蛋
├── gallery.js              # 照片墙渲染 + 灯箱
├── upload.js               # token、压图、GitHub 提交
├── favicon.svg
├── site.webmanifest
├── README.md
├── gallery/
│   └── index.json          # 照片清单
└── assets/
    ├── lab-zero.webp
    ├── lab-zero-boss.webp
    ├── toon-blaster.webp
    ├── zcool-subset.woff2
    ├── fredoka-latin.woff2
    ├── og-cover.png
    └── apple-touch-icon.png
```

## 素材与字体

- 游戏截图来自 qyx 自己的《零号实验区》与《卡通大乱斗》，已压缩为 WebP。
- 中文标题字体：[站酷快乐体 ZCOOL KuaiLe](https://fonts.google.com/specimen/ZCOOL+KuaiLe)，SIL Open Font License 1.1。
- 拉丁字母与数字：[Fredoka](https://fonts.google.com/specimen/Fredoka)，SIL Open Font License 1.1。
- 字体均已本地化并按页面用字做了子集裁剪，不依赖任何外部 CDN。

## 兼容性

面向现代浏览器（Chrome / Edge / Safari / Firefox 近两年的版本）。照片上传使用 Canvas 压缩和 GitHub API，需要浏览器允许 `fetch` 到 `api.github.com`；开启 `prefers-reduced-motion` 时，星空、进场和倾斜等动态效果会收敛为静态。
