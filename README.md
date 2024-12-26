# 个人电子书库

这是一个基于GitHub Pages的个人电子书库网站，用于展示和管理个人收藏的电子书籍。

## 功能特点

- 响应式设计，支持各种设备访问
- 书籍分类浏览
- 搜索功能
- 书籍详情展示
- 简洁美观的界面

## 使用说明

1. 克隆仓库到本地：
   ```bash
   git clone https://github.com/[你的用户名]/ebook-library.git
   ```

2. 添加新书籍：
   - 在 `books.json` 文件中添加新的书籍信息
   - 将书籍封面图片放入 `images` 目录

3. 部署：
   - 将更改推送到GitHub仓库
   - GitHub Actions 将自动构建并部署到GitHub Pages

## 目录结构

```
ebook-library/
├── index.html          # 主页面
├── css/               # 样式文件
│   └── style.css
├── js/                # JavaScript文件
│   └── main.js
├── images/           # 书籍封面图片
└── _config.yml       # Jekyll配置文件
```

## 技术栈

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Jekyll
- GitHub Pages

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

MIT License 