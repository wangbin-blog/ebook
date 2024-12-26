import { BaseReader } from './BaseReader.js';
import { ERROR_CODES } from '../utils/ErrorHandler.js';

/**
 * PDF 阅读器类
 * 负责处理 PDF 格式的电子书
 * @extends BaseReader
 */
export class PDFReader extends BaseReader {
    /**
     * 创建 PDF 阅读器实例
     * @param {HTMLElement} container - 渲染容器
     */
    constructor(container) {
        super(container);
        this.pdf = null;
        this.scale = 1.0;
        this.rotation = 0;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.canvas = null;
        this.ctx = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.pdfLoadingTask = null;
        this.resizeObserver = null;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.scrollTimeout = null;

        // 设置容器样式
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.overflow = 'auto';  // 改为可滚动
        this.container.style.backgroundColor = '#f0f0f0';

        // 动态显示
        this.loadingElement = document.createElement('div');
        this.loadingElement.style.position = 'absolute';
        this.loadingElement.style.top = '50%';
        this.loadingElement.style.left = '50%';
        this.loadingElement.style.transform = 'translate(-50%, -50%)';
        this.loadingElement.style.textAlign = 'center';
        this.container.appendChild(this.loadingElement);

        // 添加滚动事件监听
        this.container.addEventListener('scroll', this.handleScroll.bind(this));
        // 添加键盘事件监听
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * 显示加载状态
     * @private
     * @param {string} message - 状态消息
     */
    showLoading(message) {
        this.loadingElement.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <div class="mt-3 text-muted">${message}</div>
        `;
        this.loadingElement.style.display = 'block';
    }

    /**
     * 隐藏加载状态
     * @private
     */
    hideLoading() {
        this.loadingElement.style.display = 'none';
    }

    /**
     * 显示��误信息
     * @private
     * @param {string} message - 错误信息
     */
    showError(message) {
        this.loadingElement.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${message}
            </div>
        `;
        this.loadingElement.style.display = 'block';
    }

    /**
     * 等待 PDF.js 加载完成
     * @private
     * @returns {Promise<void>}
     */
    async waitForPDFJS() {
        const maxAttempts = 50; // 最多等待5秒
        let attempts = 0;

        const checkPDFJS = () => {
            return typeof window.pdfjsLib !== 'undefined' &&
                typeof window.pdfjsLib.getDocument === 'function';
        };

        // 如果已经加载完成，直接返回
        if (checkPDFJS()) {
            console.log('PDF.js 库已就绪');
            return;
        }

        while (attempts < maxAttempts) {
            try {
                // 如果 PDF.js 还没加载完成，尝试重新加载
                if (!checkPDFJS() && typeof window.loadPDFJS === 'function') {
                    console.log('尝试加载 PDF.js 库...');
                    await window.loadPDFJS();
                }

                // 再次检查是否加载成功
                if (checkPDFJS()) {
                    console.log('PDF.js 库加载成功');
                    return;
                }
            } catch (error) {
                console.error('加载 PDF.js 失败，将继续重试:', error);
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        throw new Error('PDF.js 库加载失败，请检查网络连接或刷新页面重试');
    }

    /**
     * 加载 PDF 内容
     * @param {Response} response - fetch响应对象
     * @returns {Promise<void>}
     */
    async load(response) {
        try {
            this.showLoading('正在加载 PDF...');

            // 检查 response 是否有效
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 等待 PDF.js 加载完成
            try {
                await this.waitForPDFJS();
                console.log('PDF.js 库已就绪，开始加载文档');
            } catch (error) {
                console.error('等待 PDF.js 加载失败:', error);
                throw error;
            }

            const arrayBuffer = await response.arrayBuffer();
            if (arrayBuffer.byteLength === 0) {
                throw new Error('PDF 文件为空');
            }

            console.log('PDF 文件大小:', (arrayBuffer.byteLength / 1024 / 1024).toFixed(2) + 'MB');

            // 如果存在之前的加载任务，取消它
            if (this.pdfLoadingTask) {
                await this.pdfLoadingTask.destroy();
            }

            // 创建新的加载任务
            this.pdfLoadingTask = window.pdfjsLib.getDocument({
                data: arrayBuffer,
                isEvalSupported: false,
                useSystemFonts: true,
                disableFontFace: false
            });

            // 监听加载进度
            this.pdfLoadingTask.onProgress = (progress) => {
                if (progress.total > 0) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    this.showLoading(`正在加载 PDF... ${percent}%`);
                }
            };

            console.log('开始加载 PDF 文档');
            this.pdf = await this.pdfLoadingTask.promise;
            console.log('PDF 文档加载完成');
            this.totalPages = this.pdf.numPages;

            if (this.totalPages === 0) {
                throw new Error('PDF 文件没有页面');
            }

            console.log('PDF 总页数:', this.totalPages);

            // 创建页面容器
            const pagesContainer = document.createElement('div');
            pagesContainer.style.padding = '20px';
            pagesContainer.style.backgroundColor = '#f0f0f0';
            this.container.appendChild(pagesContainer);

            // 渲染所有页面
            this.showLoading('正在渲染页面...');
            for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
                const pageContainer = document.createElement('div');
                pageContainer.style.marginBottom = '20px';
                pageContainer.style.backgroundColor = '#ffffff';
                pageContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                pagesContainer.appendChild(pageContainer);

                const canvas = document.createElement('canvas');
                canvas.style.display = 'block';
                canvas.style.margin = '0 auto';
                pageContainer.appendChild(canvas);

                const page = await this.pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const renderContext = {
                    canvasContext: canvas.getContext('2d'),
                    viewport: viewport
                };

                await page.render(renderContext).promise;
                console.log(`页面 ${pageNum} 渲染完成`);
            }

            // 隐藏加载状态
            this.hideLoading();

            // 获取文档元数据
            const metadata = await this.pdf.getMetadata();
            const title = metadata?.info?.Title || this.getFileNameFromPath() || '未命名文档';

            // 触发加载完成事件
            this.emit('loaded', {
                totalPages: this.totalPages,
                title: title
            });

            // 初始化事件监听和功能
            this.initializeEventListeners();
        } catch (error) {
            console.error('PDF加载失败:', error);
            this.showError(`PDF加载失败: ${error.message}`);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * 从路径中获取文件名
     * @private
     * @returns {string}
     */
    getFileNameFromPath() {
        try {
            const url = new URL(window.location.href);
            const bookPath = url.searchParams.get('book');
            if (bookPath) {
                const decodedPath = decodeURIComponent(bookPath);
                const fileName = decodedPath.split('/').pop();
                return fileName.replace(/\.[^/.]+$/, ''); // 移除扩展名
            }
        } catch (error) {
            console.error('获取文件名失败:', error);
        }
        return null;
    }

    /**
     * 处理滚动事件
     * @private
     */
    handleScroll() {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }

        this.scrollTimeout = setTimeout(() => {
            const containerHeight = this.container.clientHeight;
            const scrollTop = this.container.scrollTop;
            const scrollHeight = this.container.scrollHeight;
            const maxScroll = scrollHeight - containerHeight;

            // 检查是否滚动到底部
            const isAtBottom = Math.ceil(scrollTop) >= maxScroll || Math.abs(maxScroll - scrollTop) < 1;

            if (isAtBottom) {
                // 如果滚动到底部，设置为最后一页
                this.currentPage = this.totalPages;
            } else {
                // 计算当前页码，使用maxScroll确保不会超过总页数
                const scrollPercentage = scrollTop / maxScroll;
                const targetPage = Math.max(1, Math.min(
                    Math.round(scrollPercentage * (this.totalPages - 1)) + 1,
                    this.totalPages
                ));
                this.currentPage = targetPage;
            }

            this.emit('pageChanged', {
                pageNumber: this.currentPage,
                totalPages: this.totalPages
            });
            this.updateProgress(this.currentPage);
        }, 100);
    }

    /**
     * 处理键盘事件
     * @private
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyDown(event) {
        switch (event.key) {
            case 'ArrowUp':
            case 'PageUp':
                event.preventDefault();
                this.container.scrollBy({
                    top: -this.container.clientHeight * 0.9,
                    behavior: 'smooth'
                });
                break;
            case 'ArrowDown':
            case 'PageDown':
            case ' ':  // 空格键
                event.preventDefault();
                this.container.scrollBy({
                    top: this.container.clientHeight * 0.9,
                    behavior: 'smooth'
                });
                break;
            case 'Home':
                event.preventDefault();
                this.container.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                break;
            case 'End':
                event.preventDefault();
                this.container.scrollTo({
                    top: this.container.scrollHeight,
                    behavior: 'smooth'
                });
                break;
        }
    }

    /**
     * 跳转到指定页面
     * @param {number} pageNumber - 页码
     */
    goToPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.totalPages) {
            return;
        }

        const pageHeight = this.container.scrollHeight / this.totalPages;
        const targetPosition = (pageNumber - 1) * pageHeight;

        this.container.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    /**
     * 上一页
     */
    prev() {
        this.goToPage(this.currentPage - 1);
    }

    /**
     * 下一页
     */
    next() {
        this.goToPage(this.currentPage + 1);
    }

    /**
     * 设置缩放比例
     * @param {number} scale - 缩放比例
     */
    setScale(scale) {
        if (scale >= 0.25 && scale <= 3.0) {
            this.scale = scale;
            // 重新加载当前页面
            this.goToPage(this.currentPage);
        }
    }

    /**
     * 设置字体大小
     * @param {string} size - 字体大小（'small' | 'medium' | 'large'）
     */
    setFontSize(size) {
        console.log('设置字体大小:', size);
        const scales = {
            small: 1.2,
            medium: 1.5,
            large: 2.0
        };

        if (scales[size]) {
            console.log('应用缩放比例:', scales[size]);
            this.scale = scales[size];
            this.showLoading('正在调整字体大小...');
            this.reloadDocument().catch(error => {
                console.error('调整字体大小失败:', error);
                this.showError('调整字体大小失败: ' + error.message);
            });
        }
    }

    /**
     * 重新加载文档
     * @private
     */
    async reloadDocument() {
        try {
            console.log('开始重新加载文档，当前缩放比例:', this.scale);
            const currentScrollPercentage = this.container.scrollTop / this.container.scrollHeight;

            // 清空容器
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }

            // 重新创建加载状态显示
            this.loadingElement = document.createElement('div');
            this.loadingElement.style.position = 'absolute';
            this.loadingElement.style.top = '50%';
            this.loadingElement.style.left = '50%';
            this.loadingElement.style.transform = 'translate(-50%, -50%)';
            this.loadingElement.style.textAlign = 'center';
            this.container.appendChild(this.loadingElement);

            // ��建页面容器
            const pagesContainer = document.createElement('div');
            pagesContainer.style.padding = '20px';
            pagesContainer.style.backgroundColor = '#f0f0f0';
            this.container.appendChild(pagesContainer);

            // 重新渲染所有页面
            console.log('开始渲染页面，总页数:', this.totalPages);
            for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
                console.log(`渲染第 ${pageNum} 页`);
                const pageContainer = document.createElement('div');
                pageContainer.style.marginBottom = '20px';
                pageContainer.style.backgroundColor = '#ffffff';
                pageContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                pagesContainer.appendChild(pageContainer);

                const canvas = document.createElement('canvas');
                canvas.style.display = 'block';
                canvas.style.margin = '0 auto';
                pageContainer.appendChild(canvas);

                const page = await this.pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: this.scale });

                // 设置画布尺寸
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const renderContext = {
                    canvasContext: canvas.getContext('2d'),
                    viewport: viewport
                };

                await page.render(renderContext).promise;
                console.log(`第 ${pageNum} 页渲染完成`);
            }

            // 恢复滚动位置
            this.container.scrollTop = currentScrollPercentage * this.container.scrollHeight;
            console.log('文档重新加载完成');
            this.hideLoading();

            // 触发渲染完成事件
            this.emit('rendered', { scale: this.scale });
        } catch (error) {
            console.error('重新加载文档失败:', error);
            this.showError('重新加载文档失败: ' + error.message);
            throw error;
        }
    }

    /**
     * 设置主题
     * @param {Object} theme - 主题样式
     */
    setTheme(theme) {
        if (theme?.body) {
            const isDark = theme.body.background === '#222222';

            // 更新页面容器的样式
            const pagesContainer = this.container.querySelector('div');
            if (pagesContainer) {
                pagesContainer.style.backgroundColor = isDark ? '#1a1a1a' : '#f0f0f0';
            }

            // 更新每个页面的样式
            const pages = this.container.querySelectorAll('div > div');
            pages.forEach(page => {
                // 设置页面背景色
                page.style.backgroundColor = theme.body.background;
                // 设置文字颜色
                page.style.color = theme.body.color;
                // 调整阴影效果
                page.style.boxShadow = isDark ? '0 2px 5px rgba(0,0,0,0.3)' : '0 2px 5px rgba(0,0,0,0.1)';
            });

            // 更新画布的过滤器（如果在暗黑模式下）
            const canvases = this.container.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                if (isDark) {
                    canvas.style.filter = 'brightness(0.9) invert(0.9)';
                } else {
                    canvas.style.filter = 'none';
                }
            });

            // 更新阅读器背景色
            this.container.style.backgroundColor = isDark ? '#1a1a1a' : '#f0f0f0';

            // 更新加载状态显示的样式
            if (this.loadingElement) {
                this.loadingElement.style.color = theme.body.color;
            }
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        super.cleanup();
        if (this.pdfLoadingTask) {
            this.pdfLoadingTask.destroy();
            this.pdfLoadingTask = null;
        }
        if (this.pdf) {
            this.pdf.destroy();
            this.pdf = null;
        }
        // 移除事件监听器
        this.container.removeEventListener('scroll', this.handleScroll);
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    /**
     * 跳转到指定章节
     * @param {string} dest - 目标位置
     */
    async goToChapter(dest) {
        try {
            console.log('跳转到章节:', dest);
            if (!this.pdf) {
                throw new Error('PDF 文档未加载');
            }

            // 获取目标页码
            let pageNumber;
            if (typeof dest === 'string') {
                // 如果是字符串式的目标位置，需要先解析
                const destination = await this.pdf.getDestination(dest);
                const ref = await this.pdf.getPageRef(destination[0]);
                pageNumber = await this.pdf.getPageIndex(ref) + 1;
            } else if (typeof dest === 'number') {
                pageNumber = dest;
            } else {
                throw new Error('无效的目标位置');
            }

            // 跳转到目标页
            await this.goToPage(pageNumber);
        } catch (error) {
            console.error('跳转章节失败:', error);
            this.handleError(error);
        }
    }

    /**
     * 初始化进度条
     * @private
     */
    initializeProgress() {
        const progress = document.getElementById('progress');
        if (progress) {
            // 更新初始进度
            this.updateProgress(this.currentPage);

            // 监听进度条拖动
            progress.addEventListener('input', () => {
                const percentage = progress.value;
                // 直接根据百分比计算页码
                const targetPage = Math.max(1, Math.min(
                    Math.round((percentage / 100) * this.totalPages),
                    this.totalPages
                ));

                // 立即更新当前页码
                this.currentPage = targetPage;
                this.emit('pageChanged', {
                    pageNumber: targetPage,
                    totalPages: this.totalPages
                });

                // 计算目标滚动位置
                const scrollHeight = this.container.scrollHeight;
                const containerHeight = this.container.clientHeight;
                const maxScroll = scrollHeight - containerHeight;
                const targetScroll = (percentage / 100) * maxScroll;

                // 滚动到目标位置
                this.container.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            });
        }
    }

    /**
     * 更新进度条
     * @private
     * @param {number} currentPage - 当前页码
     */
    updateProgress(currentPage) {
        const progress = document.getElementById('progress');
        if (progress && this.totalPages > 0) {
            // 修改进度计算公式，确保最后一页时显示100%
            const percentage = ((currentPage - 1) / Math.max(1, this.totalPages - 1)) * 100;
            progress.value = percentage;

            // 更新进度显示
            this.emit('progressChanged', {
                percentage: Math.round(percentage),
                current: currentPage,
                total: this.totalPages
            });
        }
    }

    /**
     * 初始化主题
     * @private
     */
    initializeTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            this.setTheme({
                body: {
                    color: '#ffffff',
                    background: '#222222'
                }
            });
        }
    }

    /**
     * 初始化事件监听
     * @private
     */
    initializeEventListeners() {
        super.initializeEventListeners();

        // 滚动事件监听
        this.handleScroll = () => {
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }

            this.scrollTimeout = setTimeout(() => {
                const containerHeight = this.container.clientHeight;
                const scrollTop = this.container.scrollTop;
                const scrollHeight = this.container.scrollHeight;

                // 计算当前页面，考虑滚动到底部的情
                const currentPosition = scrollTop + containerHeight;
                const isAtBottom = Math.ceil(currentPosition) >= scrollHeight ||
                    Math.abs(scrollHeight - currentPosition) < 1;

                if (isAtBottom) {
                    // 如果滚动到底部，设置为最后一页
                    this.currentPage = this.totalPages;
                    this.emit('pageChanged', {
                        pageNumber: this.totalPages,
                        totalPages: this.totalPages
                    });
                } else {
                    const pageHeight = scrollHeight / this.totalPages;
                    const newPage = Math.max(1, Math.min(Math.ceil(currentPosition / pageHeight), this.totalPages));

                    if (newPage !== this.currentPage) {
                        this.currentPage = newPage;
                        this.emit('pageChanged', {
                            pageNumber: this.currentPage,
                            totalPages: this.totalPages
                        });
                    }
                }
            }, 100);
        };
        this.container.addEventListener('scroll', this.handleScroll);

        // 键盘事件监听
        this.handleKeyDown = (event) => {
            switch (event.key) {
                case 'ArrowUp':
                case 'PageUp':
                    event.preventDefault();
                    this.container.scrollBy({
                        top: -this.container.clientHeight * 0.9,
                        behavior: 'smooth'
                    });
                    break;
                case 'ArrowDown':
                case 'PageDown':
                case ' ':  // 空格键
                    event.preventDefault();
                    this.container.scrollBy({
                        top: this.container.clientHeight * 0.9,
                        behavior: 'smooth'
                    });
                    break;
                case 'Home':
                    event.preventDefault();
                    this.container.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    break;
                case 'End':
                    event.preventDefault();
                    this.container.scrollTo({
                        top: this.container.scrollHeight,
                        behavior: 'smooth'
                    });
                    break;
            }
        };
        document.addEventListener('keydown', this.handleKeyDown);
    }
} 