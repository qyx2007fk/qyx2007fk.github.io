# qyx的妙妙屋

> 一间装着奇思妙想的小屋。现在住进来的是两款打开网页就能玩的小游戏，以后还会慢慢添置新的房间。

这是 qyx 的个人主页，纯静态站点：**没有构建步骤，没有框架，没有 npm 依赖**，HTML / CSS / 原生 JS 手搓。

## 现在收录了什么

| 房间 | 游戏 | 线上地址 | 一句介绍 |
| --- | --- | --- | --- |
| ROOM 01 | 零号实验区 · LAB ZERO | <https://qyx2007fk.github.io/lab-zero/> | 2D 俯视角战术枪战，五种模式、五名干员，支持局域网 PVE / PVP |
| ROOM 02 | 卡通大乱斗 · TOON BLASTER | <https://qyx2007fk.github.io/toon-blaster/> | 3D 第一人称卡通射击，五个主题关卡、五把武器、三阶段 BOSS |

> 你说的 “blast” 就是 `toon-blaster` 这个仓库，页面里的名字是「卡通大乱斗 · TOON BLASTER」。

## 页面结构

- **首屏**：屋名 + 两张游戏拍立得，右上角可开灯 / 关灯
- **游戏厅**：两张游戏卡，点封面或按钮直接跳转线上游戏
- **屋主**：门牌、简短介绍、常用工具与常出没的地方
- **敲门**：GitHub 入口 + 一键复制本页链接
- **彩蛋**：在页面里依次敲 `qyx`，会下一场星星雨（控制台也有留言）

## 本地预览

在 `qyx-wonder-room/` 目录里启动一个静态服务：

```bash
cd qyx-wonder-room
python3 -m http.server 4173
```

然后打开 <http://127.0.0.1:4173/>。

> 建议用本地服务预览，直接双击 `index.html` 也能打开，但个别浏览器会限制 `file://` 下的字体加载。

## 想改点什么

| 想改的内容 | 去哪里改 |
| --- | --- |
| 两个游戏的链接、卡片文案 | `index.html`（搜索 `qyx2007fk.github.io`） |
| 屋名、介绍、小档案 | `index.html` |
| 配色、字号、间距 | `styles.css` 顶部的 `:root` / `[data-theme="day"]` 变量 |
| 星空、倾斜、彩蛋等交互 | `app.js` |
| 游戏截图 | 替换 `assets/*.webp`，保持 1200×750（16:10）即可 |
| 社交分享封面 | `assets/og-cover.png`（1200×630） |

## 部署到 GitHub Pages

### 方案 A：作为个人主页（推荐）

这样访问地址就是 **<https://qyx2007fk.github.io/>**，最像“个人网站”。

1. 在 GitHub 新建一个仓库，名字必须是 `qyx2007fk.github.io`（把 `qyx2007fk` 换成你的 GitHub 用户名）。
2. 把本目录里的文件推到该仓库的 `main` 分支：

   ```bash
   cd qyx-wonder-room
   git init
   git add .
   git commit -m "qyx的妙妙屋：第一版"
   git branch -M main
   git remote add origin https://github.com/qyx2007fk/qyx2007fk.github.io.git
   git push -u origin main
   ```

3. 打开仓库的 **Settings → Pages**，Source 选择 **Deploy from a branch**，分支选 `main`、目录选 `/ (root)`，保存。
4. 等一两分钟，访问 <https://qyx2007fk.github.io/>。

### 方案 B：作为项目页

仓库名随意（比如 `wonder-room`），Pages 同样选 `main` / root，访问地址会变成：

```text
https://qyx2007fk.github.io/wonder-room/
```

站内所有资源都是相对路径，放在子路径下也能正常工作。

### 部署后可以再补两件事

- 把 `index.html` 里的 `og:image` / `twitter:image` 换成绝对地址（方便微信、微博、Telegram 等抓取分享封面）：
  `https://qyx2007fk.github.io/assets/og-cover.png`
- 想换域名的话，在仓库根目录加一个 `CNAME` 文件，内容写你的域名。

## 文件结构

```text
qyx-wonder-room/
├── index.html              # 首页
├── 404.html                # 走错房间时的小提示
├── styles.css              # 全部样式（含夜间 / 日间主题）
├── app.js                  # 星空、滚动、倾斜、开灯、彩蛋
├── favicon.svg             # 站点图标
├── site.webmanifest        # 添加到主屏幕用
├── README.md
└── assets/
    ├── lab-zero.webp       # 首屏截图
    ├── lab-zero-boss.webp  # 游戏卡截图
    ├── toon-blaster.webp   # 卡通大乱斗截图
    ├── zcool-subset.woff2  # 站酷快乐体（按页面用字裁剪，约 37 KB）
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

面向现代浏览器（Chrome / Edge / Safari / Firefox 近两年的版本）。启用了 `prefers-reduced-motion` 时，星空、滚动进场、卡片倾斜等动态效果会自动收敛为静态。
