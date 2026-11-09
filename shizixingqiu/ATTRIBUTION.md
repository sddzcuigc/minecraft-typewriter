# 数据来源、许可与版权边界

## 3500字字表
汉字、拼音、笔画、部首和频率字段整理自 [mapull/chinese-dictionary](https://github.com/mapull/chinese-dictionary) 的 `character/common/char_common_base.json`。上游项目按 MIT License 发布，但其 README 对部分源数据的可追溯性提出保留意见，故本数据仅作为辅助学习字表，仍需抽样校对。

## 笔顺数据
- 项目： [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data)
- 原始数据来源： [Make Me a Hanzi](https://github.com/skishore/makemeahanzi)
- 数据许可：Arphic Public License（见 `STROKE-DATA-LICENSE.txt`）。
- 数据字段：逐笔 SVG 路径与中线。项目代码 Hanzi Writer 为 MIT，但笔画数据许可独立，不能混为一谈。
- 当前离线内置：一、二、十、人、入、八、口、山。其他字符按需联网拉取并缓存。数据展示不等于人工逐字审校。

## 图片搜索
- 来源：Wikimedia Commons MediaWiki API。
- 使用 `imageinfo/extmetadata` 读取作者、许可名称、许可链接、原始文件页等元数据。
- 仅显示许可字段可识别且筛选为 CC BY、CC BY-SA、CC0 或 Public Domain 的结果；排除 NC、ND 条目。
- 用户缓存时保留标题、作者、许可、许可链接、原始文件页与图片 Blob。用户仍需打开原始文件页确认具体许可和署名要求。Commons 的机器可读许可元数据并非所有文件都完整。
- 搜索与下载仅在用户使用联网功能时发生；图片仅在用户点击“缓存到离线图册”后存入本机 IndexedDB。

## 人教版教材
- 人民教育出版社官网：https://www.pep.com.cn/
- 人教社数字资源版权声明：https://www.pep.com.cn/tsg/tsg_zydh/tsg_zydh_bqsm/
- 本项目不批量下载、打包或再分发人教版课文；“教材夹”只保存用户主动输入的短句，并留在当前浏览器本地。原创例句明确标为非教材原文。

## 项目自编内容
间架结构口诀、记忆提示、练习词语与原创例句由本项目编写，作为学习辅助；不应被当作官方规范、教材原文或唯一正确写法。


## V2.2 现代字义及《说文解字》
- [mapull/chinese-dictionary](https://github.com/mapull/chinese-dictionary) 的 `char_common_detail.json`：仓库标记 MIT License，上游说明部分数据质量和原始出处无法严格保证。本项目只抽取短释义并明确标注“待逐字校验”；原仓库许可文本位于 UPSTREAM-MIT-LICENSE.txt。
- [gujilab/chinese-classical-corpus](https://github.com/gujilab/chinese-classical-corpus) 的 `output/shuowen.json`：整理本《说文解字》原文，数据 CC0 1.0；仅原文引用，不将其观点或释文自动认定为现代文字学结论。
- 特殊风险：简繁、古今字与异体字不能简单一一等同；自动匹配结果只供参考，暂未进行全部3500字人工审定。
- 字形联想图使用原生 SVG 根据字符、字形结构和部首图标生成；是可离线使用的记忆示意图，不是古文字图谱或真实世界物象照片。
