# 电子书阅读器开发笔记

## 一、基本功能实现流程

1. **初始化项目结构**
   - 创建基本的 HTML/CSS/JS 文件
   - 设置文件目录结构（data 目录存放电子书）
   - 添加必要的依赖（Bootstrap、Font Awesome 等）

2. **核心依赖引入**
```html
<!-- 基础样式和图标库 -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">

<!-- epub.js 必需的 JSZip 库 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

<!-- epub.js 主要和备用源 -->
<script src="https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js"></script>
<script>
    // 主要 CDN 加载失败时的备用方案
    if (typeof ePub === 'undefined') {
        document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/epub.js/0.3.93/epub.min.js"><\/script>');
    }
</script>
```

3. **界面结构设计**
```html
<!-- 顶部工具栏 -->
<div class="toolbar">
    <!-- 返回按钮 -->
    <a href="index.html" class="btn btn-outline-secondary">
        <i class="fas fa-arrow-left"></i>
    </a>
    
    <!-- 书籍标题 -->
    <h1 class="toolbar-title h6 mb-0" id="book-title">加载中...</h1>
    
    <!-- 控制按钮组 -->
    <div class="toolbar-controls">
        <button class="btn btn-outline-secondary" id="prev">
            <i class="fas fa-chevron-left"></i>
        </button>
        <input type="range" class="form-range" id="progress" value="0" min="0" max="100">
        <button class="btn btn-outline-secondary" id="next">
            <i class="fas fa-chevron-right"></i>
        </button>
    </div>
</div>

<!-- 阅读器主容器 -->
<div id="viewer">
    <!-- 加载动画 -->
    <div class="loading">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">加载中...</span>
        </div>
        <div id="loading-status" class="mt-3 text-muted"></div>
    </div>
</div>
```

## 二、问题解决过程

1. **文件路径问题**
```javascript
// 处理文件路径
const bookPath = decodeURIComponent(urlParams.get('book'));
if (!bookPath) {
    showError('未指定电子书文件');
    return;
}

// 确保使用相对路径，并处理 GitHub Pages 的基础路径
const baseUrl = document.querySelector('base')?.href || 
    window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
const cleanPath = bookPath.replace(/^\/+/, '').replace(/^data\/+/, 'data/');
const fullPath = new URL(cleanPath, baseUrl).href;
```

2. **依赖加载问题**
```html
<!-- 确保 JSZip 在 epub.js 之前加载 -->
<script src="jszip.min.js"></script>
<script src="epub.min.js"></script>

<!-- 添加本地备用方案 -->
<script>
    if (typeof ePub === 'undefined') {
        document.write('<script src="js/lib/epub.min.js"><\/script>');
    }
</script>
```

3. **渲染问题**
```javascript
// 创建专用渲染容器
const viewerDiv = document.createElement('div');
viewerDiv.id = 'epub-viewer';
viewerDiv.style.height = '100%';
viewer.appendChild(viewerDiv);

// 初始化电子书
const book = ePub(blob);

// 配置渲染选项
const rendition = book.renderTo('epub-viewer', {
    width: '100%',
    height: '100%',
    spread: 'none',           // 禁用双页显示
    flow: 'scrolled-doc',     // 使用滚动式布局
    allowScriptedContent: true, // 允许脚本内容
    manager: 'continuous'      // 使用连续滚动管理器
});

// 设置渲染样式
rendition.themes.default({
    'body': {
        'padding': '20px',
        'max-width': '800px',
        'margin': '0 auto',
        'font-family': 'system-ui, -apple-system, sans-serif',
        'line-height': '1.6',
        'background-color': 'var(--background-color)',
        'color': 'var(--text-color)'
    }
});
```

4. **安全策略问题**
```html
<!-- 配置内容安全策略 -->
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self' https: blob: data:; 
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; 
    style-src 'self' 'unsafe-inline' https:; 
    img-src 'self' blob: data: https:; 
    worker-src blob:; 
    connect-src 'self' blob: https:; 
    media-src blob:; 
    frame-src 'self' blob: data:;">
```

## 三、错误处理实现

```javascript
// 错误显示函数
function showError(message) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    // 移除加载动画
    viewer.querySelector('.loading')?.remove();
}

// 加载状态更新
function updateLoadingStatus(message) {
    if (loadingStatus) {
        loadingStatus.textContent = message;
    }
}

// 文件加载错误处理
fetch(fullPath, {
    headers: {
        'Accept': 'application/epub+zip, application/pdf, application/octet-stream',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    },
    cache: 'no-cache'
}).then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.blob();
}).catch(error => {
    console.error('获取电子书文件失败:', error);
    showError('获取电子书文件失败：' + (error.message || '未知错误'));
});

// 电子书加载错误处理
book.on('book:error', (error) => {
    console.error('电子书加载错误:', error);
    showError(`电子书加载错误: ${error.message || '未知错误'}`);
});

// 渲染错误处理
rendition.display().then(() => {
    console.log('电子书显示成功');
    updateLoadingStatus('加载完成');
}).catch(error => {
    console.error('显示电子书失败:', error);
    showError('加载电子书失败：' + (error.message || '未知错误'));
});
```

## 四、优化建议

1. **性能优化**
   - 实现大文件分片加载
   - 添加文件缓存机制
   - 优化渲染性能

2. **用户体验**
   - 保存阅读进度
   - 添加书签功能
   - 支持主题切换

3. **兼容性**
   - 添加浏览器特性检测
   - 提供降级方案
   - 优化移动端体验

## 五、注意事项

1. **路径处理**
   - 使用相对路径确保部署兼容性
   - 正确处理 URL 编码
   - 考虑跨域访问限制

2. **安全考虑**
   - 合理配置 CSP
   - 处理用户输入
   - 防止 XSS 攻击

3. **错误处理**
   - 提供友好的错误提示
   - 记录错误日志
   - 实现错误恢复机制 

## 六、GitHub Pages 部署问题解决

1. **iframe 沙箱问题**
```javascript
// 修改渲染配置，添加安全的 iframe 设置
const rendition = book.renderTo('epub-viewer', {
    width: '100%',
    height: '100%',
    spread: 'none',
    flow: 'scrolled-doc',
    allowScriptedContent: false,  // 禁用脚本内容
    manager: 'continuous',
    view: {
        resizeOnOrientationChange: true,
        // 设置安全的 iframe 选项
        iframe: {
            sandbox: 'allow-same-origin',  // 只允许同源
            allowtransparency: true,
            allowfullscreen: false,
            allowscriptaccess: 'never'
        }
    }
});
```

2. **CSP 策略更新**
```html
<!-- 更新内容安全策略以支持 blob URL -->
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self' https: blob: data:; 
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; 
    style-src 'self' 'unsafe-inline' https: blob:;  <!-- 添加 blob: -->
    img-src 'self' blob: data: https:; 
    worker-src blob:; 
    connect-src 'self' blob: https:; 
    media-src blob:; 
    frame-src 'self' blob: data:;
    style-src-elem 'self' 'unsafe-inline' https: blob:;">  <!-- 添加 style-src-elem -->
```

3. **样式加载优化**
```javascript
// 预处理样式设置
rendition.hooks.content.register((contents) => {
    // 直接注入样式而不是使用 blob URL
    const styles = `
        body {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            background-color: var(--background-color);
            color: var(--text-color);
        }
        p { margin-bottom: 1em; }
        img { max-width: 100%; height: auto; }
    `;
    
    contents.addStylesheetRules(styles);
});

// 主题切换处理
function updateTheme(isDark) {
    rendition.themes.default({
        'body': {
            'background-color': isDark ? '#222' : '#fff',
            'color': isDark ? '#fff' : '#000'
        }
    });
}
```

4. **部署检查清单**
   - 确保所有资源使用 HTTPS
   - 验证相对路径正确性
   - 检查 CSP 配置
   - 测试跨域资源访问
   - 验证 iframe 安全性

5. **调试提示**
```javascript
// 添加调试信息
book.ready.then(() => {
    console.log('电子书准备就绪');
    // 检查 iframe 设置
    const iframe = document.querySelector('#epub-viewer iframe');
    if (iframe) {
        console.log('iframe sandbox 属性:', iframe.getAttribute('sandbox'));
    }
}).catch(error => {
    console.error('电子书准备失败:', error);
});

// 监控样式加载
rendition.hooks.content.register((contents) => {
    contents.on('error', (error) => {
        console.error('内容加载错误:', error);
    });
});
```

这些修改主要解决了在 GitHub Pages 上部署时遇到的问题：

1. 通过限制 iframe 的权限来解决沙箱警告
2. 更新 CSP 策略以支持必要的资源加载
3. 优化样式注入方式，避免使用 blob URL
4. 添加更多的调试信息和错误处理

建议在本地测试这些更改，确保它们能正常工作，然后再部署到 GitHub Pages。如果仍然遇到问题，可以查看浏览器控制台的详细错误信息进行进一步调试。 