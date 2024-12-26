# 个人电子书库系统

这是一个简单易用的个人电子书库系统，支持EPUB和PDF格式的电子书管理和阅读。你可以用它来搭建属于自己的电子书收藏库。

🌐 在线演示：[https://lkxnif.github.io/ebook-library/](https://lkxnif.github.io/ebook-library/)

💬 有任何想法或建议？欢迎在 [Discussions](https://github.com/lkxnif/ebook-library/discussions) 中交流讨论！

## 快速开始

1. 下载或克隆这个仓库到你的电脑上
2. 使用任意网页服务器打开项目目录（推荐使用 Visual Studio Code + Live Server 插件，只需右键点击 index.html 选择"Open with Live Server"即可）

## 添加你自己的电子书

1. 将你的电子书文件（EPUB或PDF格式）复制到 `data` 文件夹中
2. 将书籍封面图片（建议尺寸：300x400像素）放入 `covers` 文件夹中
3. 编辑 `data/books.json` 文件，按照已有的格式添加新书籍信息：
   - 确保每本书都有唯一的 `id`
   - 填写书籍的基本信息（标题、作者、描述等）
   - 在 `path` 字段中指定电子书文件的路径
   - 在 `cover` 字段中指定封面图片的路径

## 文件结构说明

- `index.html`: 主页面，展示书籍列表和分类
- `reader.html`: 电子书阅读器界面
- `reading-stats.html`: 阅读统计页面
- `advanced-search.html`: 高级搜索页面
- `data/books.json`: 书籍信息数据库
- `data/`: 存放电子书文件的目录
- `covers/`: 存放书籍封面图片的目录
- `css/`: 样式文件
  - `style.css`: 主要样式
  - `reader/`: 阅读器相关样式
- `js/`: JavaScript文件
  - `main.js`: 主要功能代码
  - `readers/`: 阅读器相关代码

## 自定义设置

1. 分类管理：
   - 在 `books.json` 中的 `_categories_info` 部分可以修改或添加新的图书分类
   - 在 `_tags` 数组中可以添加新的标签

2. 界面定制：
   - 修改 `css/style.css` 可以自定义网站的整体外观
   - 修改 `css/reader/` 下的文件可以自定义阅读器的样式

## 注意事项

- 建议使用现代浏览器（Chrome、Firefox、Edge等）访问
- 确保电子书文件名不包含特殊字符
- 建议将封面图片压缩到合适大小，以提高加载速度
- 定期备份 `books.json` 文件

## 功能特点

- 支持EPUB和PDF格式电子书
- 支持按分类和标签浏览
- 内置阅读器，支持阅读进度保存
- 支持阅读统计
- 支持高级搜索
- 响应式设计，适配各种屏幕尺寸

## 问题反馈

如果在使用过程中遇到任何问题，欢迎提出 Issue。

## 免责声明

```
1. 本仓库中的所有电子书仅供学习、研究和个人使用，不得用于任何商业用途。
2. 仓库中部分资源来自互联网，其版权归原作者或出版社所有。如果您是某一资源的版权持有者，并希望移除相关内容，请与我们联系。
3. 下载和使用本仓库中的电子书资源即表示您同意仅将其用于合法用途。
```

## 许可证

本项目采用 MIT 许可证，这意味着你可以自由地使用、修改和分发代码，只需保留版权声明即可。

```
MIT License
Copyright (c) 2024 lkxnif
``` 