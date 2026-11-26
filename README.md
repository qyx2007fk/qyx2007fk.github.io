# qyx的妙妙屋

> 一间装着奇思妙想的小屋。小游戏、实用工具、个人收藏，都会慢慢搬进来。
>
> **线上地址：<https://qyx2007fk.github.io/>**

纯静态站点：**没有构建步骤，没有框架，没有 npm 依赖**。HTML / CSS / 原生 JS 手搓，改完推到 `main` 就自动更新。

## 屋子里有什么

| 房间 | 现在 | 以后 |
| --- | --- | --- |
| **游戏厅** | 已开门，两款小游戏在线 | 继续做新的小游戏 |
| **工具间** | 准备中，先把位置留出来 | 格式转换、图片处理、日常小按钮…… |
| **收藏柜** | 准备中，第一格还空着 | 书、音乐、网站、图片、奇怪的小东西 |

三个房间是**并列关系**，都挂在首页的「房间目录」里；以后想加第四类（比如影音、笔记、实验），照着 `.room-card` 再复制一张就行。

游戏厅现在收录：

- 零号实验区 · LAB ZERO：<https://qyx2007fk.github.io/lab-zero/>
- 卡通大乱斗 · TOON BLASTER（你说的 blast）：<https://qyx2007fk.github.io/toon-blaster/>

## 页面结构

1. **首屏**：屋名、两段游戏拍立得、开灯 / 关灯
2. **房间目录**：游戏厅、工具间、收藏柜三张并列卡片
3. **小游戏**：两款游戏的大卡片 + 「GAME 03 还在做」
4. **实用工具**：空状态，预留了工具墙和说明
5. **个人收藏**：空状态，预留了收藏柜和说明
6. **关于**：**网站简介** + 屋主 qyx 的门牌和小档案
7. **敲门**：GitHub 入口 + 复制本页链接
8. **彩蛋**：依次敲 `qyx`，会下星星雨

## 想改点什么

| 想改的内容 | 去哪里改 |
| --- | --- |
| **网站简介** | `index.html` 搜索「网站简介」，改 `blockquote` 里那两段 `<p>` |
| 两个游戏的链接、卡片文案 | `index.html`（搜索 `qyx2007fk.github.io`） |
| 房间目录的标题、介绍 | `index.html` 的 `#rooms` 区域 |
| 工具间 / 收藏柜的空状态文案 | `index.html` 的 `#tools` / `#collection` 区域 |
| 配色、字号、间距 | `styles.css` 顶部的 `:root` / `[data-theme="day"]` 变量 |
| 星空、倾斜、彩蛋等交互 | `app.js` |
| 游戏截图 | 替换 `assets/*.webp`，保持 1200×750（16:10） |
| 社交分享封面 | `assets/og-cover.png`（1200×630） |

## 以后怎么往里加东西

### 加一款新游戏

复制小游戏区里任意一张 `.game-card`，改这几处：

1. `href` 换成新游戏的线上地址；
2. `img` 换成新截图，`alt` 写一句画面描述；
3. `<h3>`、`.game-desc`、`.game-tags`、`.game-meta` 改成新游戏的信息；
4. 上面的「房间目录」里，把游戏厅卡片的「2 款已上线」改成实际数量。

### 工具 / 收藏有内容了

现在这两个区块用的是 `.empty-room` 空状态（虚线框 + 工具墙 / 收藏柜插画）。等内容做好后，把整块 `.empty-room` 换成一个或多个内容卡片即可。

- 工具：建议保留 `#tools` 的标题和介绍，把空状态换成工具卡片；
- 收藏：建议保留「收藏柜」的说法，一个格子放一件东西。

不确定怎么排版的话，直接把内容和素材丢给我，我按现有视觉语言补进去。

### 加一个新房间

1. 在「房间目录」里复制一张 `.room-card`，改 `data-room`、标题、描述和 `href`；
2. 在下面复制一个 `.tools` 或 `.collection` 区块，改 `id`、编号和内容；
3. 把后面的「关于」编号顺延一位，导航里也可以加一个链接。

### 网站简介写在哪

`index.html` 里搜索 `<!-- ✍️ 网站简介`，下面就是那两段文字；直接改字即可，样式会跟着走。默认写的是一个草稿版本，随时可以按你的语气重写。

## 本地预览

```bash
cd qyx-wonder-room
python3 -m http.server 4173
```

然后打开 <http://127.0.0.1:4173/>。

> 直接双击 `index.html` 也能打开，但个别浏览器会限制 `file://` 下的字体加载，建议用本地服务。

## 部署

站点已经部署在 **<https://qyx2007fk.github.io/>**（仓库：`qyx2007fk/qyx2007fk.github.io`，`main` 分支根目录，GitHub Pages 自动构建）。

以后更新：

```bash
cd qyx-wonder-room
git add .
git commit -m "更新妙妙屋"
git push
```

等一两分钟，线上自动更新。

如果以后要换域名或改成子路径，记得同步改 `index.html` 里的 `canonical`、`og:image`、`twitter:image`；换域名再加一个 `CNAME` 文件。

## 文件结构

```text
qyx-wonder-room/
├── index.html              # 首页（房间目录 / 游戏 / 工具 / 收藏 / 简介）
├── 404.html                # 走错房间时的小提示
├── styles.css              # 全部样式（夜间 / 日间主题、房间卡片、空状态）
├── app.js                  # 星空、滚动、倾斜、开灯、彩蛋
├── favicon.svg             # 站点图标
├── site.webmanifest        # 添加到主屏幕用
├── README.md
└── assets/
    ├── lab-zero.webp       # 首屏截图
    ├── lab-zero-boss.webp  # 游戏卡截图
    ├── toon-blaster.webp   # 卡通大乱斗截图
    ├── zcool-subset.woff2  # 站酷快乐体（按页面用字裁剪）
    ├── fredoka-latin.woff2 # Fredoka 拉丁字母
    ├── og-cover.png        # 分享封面 1200×630
    └── apple-touch-icon.png
```

## 素材与字体

- 游戏截图来自 qyx 自己的《零号实验区》与《卡通大乱斗》，已压缩为 WebP。
- 中文标题字体：[站酷快乐体 ZCOOL KuaiLe](https://fonts.google.com/specimen/ZCOOL+KuaiLe)，SIL Open Font License 1.1。
- 拉丁字母与数字：[Fredoka](https://fonts.google.com/specimen/Fredoka)，SIL Open Font License 1.1。
- 字体均已本地化并按页面用字做了子集裁剪，不依赖任何外部 CDN。

## 兼容性

面向现代浏览器（Chrome / Edge / Safari / Firefox 近两年的版本）。开启 `prefers-reduced-motion` 时，星空、滚动进场、卡片倾斜等动态效果会自动收敛为静态。
