# UI 设计文档

## 设计提示词
- **整体风格**: Modern minimalist design with clean layout
- **视觉效果**: Apple Vision Pro style, frosted glass effect, subtle animations
- **色彩方案**: Modern blue theme with light/dark mode support
- **交互设计**: Smooth hover effects, elegant transitions
- **布局特点**: Responsive grid layout, card-based design
- **设计亮点**:
  - 毛玻璃效果：`backdrop-filter: blur(12px)`
  - 渐变装饰：`linear-gradient(to right, #0d6efd, #0d6efd80)`
  - 悬浮动画：`transform: translateY(-2px)`
  - 阴影效果：`box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1)`
  - 标签云布局：`display: flex; flex-wrap: wrap; gap: 0.5rem`
  - 半透明按钮：`background: rgba(var(--text-color-rgb), 0.03)`

## 整体风格
- 采用现代简约的设计风格
- 支持亮色/暗色主题切换
- 使用 Bootstrap 5 作为基础框架
- 响应式设计，适配移动端和桌面端

## 配色方案
### 亮色主题
- 主色调：`#0d6efd`（蓝色）
- 背景色：`#ffffff`（白色）
- 文本色：`#333333`（深灰色）
- 卡片背景：`#ffffff`（白色）
- 边框色：`#dee2e6`（浅灰色）
- 次要文本：`#6c757d`（灰色）
- 强调背景：`#ddf4ff`（浅蓝色）

### 暗色主题
- 主色调：`#2f81f7`（亮蓝色）
- 背景色：`#222222`（深灰色）
- 文本色：`#ffffff`（白色）
- 卡片背景：`#333333`（深灰色）
- 边框色：`#444444`（灰色）
- 次要文本：`#888888`（浅灰色）
- 强调背景：`#1a3f5c`（深蓝色）

## 卡片设计
### 基础样式
- 圆角边框
- 悬停时轻微上浮（transform: translateY(-2px)）
- 悬停时添加柔和阴影
- 自适应高度

### 封面图片
- 固定高度 150px
- 使用 object-fit: cover 保持比例
- 支持加载失败后的替代图片

### 标题样式
- 底部渐变装饰线
- 悬停时装饰线展开动态
- 悬停时标题变为主题色

### 标签云效果
- Vision Pro 风格的毛玻璃蒙版（backdrop-filter: blur(12px)）
- 标签以云状布局展示
- 标签带有图标
- 文字使用白色半透明效果
- 标签悬停时轻微放大

### 按钮设计
- 阅读按钮：主题色描边
- 下载按钮：绿色描边
- 按钮带有对应图标
- 合理的左右对齐方式

## 模态框设计
### 封面区域
- 最大高度 280px
- 保持图片原始比例
- 按钮对齐封面宽度

### 内容布局
- 清晰的信息分类展示
- 合理的间距和对齐
- 简洁的信息展示方式（如：格式和大小的组合显示）

## 响应式设计
### 移动端适配
- 侧边栏可滑动显示/隐藏
- 毛玻璃效果的遮罩层
- 固定位置的切换按钮
- 合理的内容堆叠

### 交互动效
- 平滑的过渡动画
- 柔和的悬停效果
- 渐变的装饰元素
- 适度的变换效果

## 可访问性
- 合理的颜色对比度
- 清晰的焦点状态
- 语义化的HTML结构
- 支持键盘导航

## 性能优化
- 图片懒加载
- 平滑的动画性能
- 合理的资源加载
- 优化的样式结构

## 导航栏设计
### 按钮样式
- 使用半透明背景配合毛玻璃效果
- 根据主题自适应的文字和边框颜色
- 优雅的悬停状态变化
- 合理的间距和对齐方式

### 排序按钮
- 固定最小宽度
- 左对齐文本
- 优化的下拉箭头位置
- Flex 布局确保对齐 