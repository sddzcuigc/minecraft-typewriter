# 识字星球（shizixingqiu）

纯静态、无 CDN、无在线 API 依赖的儿童识字与打字练习网页。

## 功能
- 8 个基础汉字学习卡：内嵌 SVG 插画、拼音、释义、组词、例句、笔画数。
- 拼音打字闯关（不带声调输入）。
- 五笔 86 版键名字根学习和编码练习。
- 学习进度、答对次数、错字本，保存在浏览器 localStorage。
- 所有资源内置，断网可使用。

## 五笔数据边界
本 MVP 收录 8 个五笔 86 版键名字根：日 JJJJ、月 EEEE、山 MMMM、水 IIII、火 OOOO、木 SSSS、口 KKKK、人 WWWW。它们是键名字根的四键输入规则，不代表普通汉字的通用编码。暂未提供 98 版数据。

## 本地运行
直接双击 index.html 即可，无需安装 Node.js。

## Vercel
这是纯静态 HTML 项目，无构建步骤。Vercel Root Directory 设置为 shizixingqiu，Framework Preset 选 Other，Build Command 留空，Output Directory 留空或设置为 .。
