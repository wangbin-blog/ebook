/**
 * 基础阅读器类
 * 提供阅读器的基本功能和事件处理
 */
export class BaseReader {
    /**
     * 创建阅读器实例
     * @param {HTMLElement} container - 渲染容器
     */
    constructor(container) {
        this.container = container;
        this.eventHandlers = new Map();
        this.currentPage = 1;
        this.totalPages = 0;

        // 创建加载状态显示元素
        this.loadingElement = document.createElement('div');
        this.loadingElement.style.position = 'absolute';
        this.loadingElement.style.top = '50%';
        this.loadingElement.style.left = '50%';
        this.loadingElement.style.transform = 'translate(-50%, -50%)';
        this.loadingElement.style.textAlign = 'center';
        this.loadingElement.style.zIndex = '1000';
        this.container.appendChild(this.loadingElement);
    }

    /**
     * 显示加载状态
     * @protected
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
        this.emit('loading', { message });
    }

    /**
     * 隐藏加载状态
     * @protected
     */
    hideLoading() {
        this.loadingElement.style.display = 'none';
    }

    /**
     * 显示错误信息
     * @protected
     * @param {string} message - 错误消息
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
     * 初始化事件监听
     * @protected
     */
    initializeEventListeners() {
        this.initializeProgress();
        this.initializeTheme();
    }

    /**
     * 初始化进度条
     * @protected
     */
    initializeProgress() {
        const progress = document.getElementById('progress');
        if (progress) {
            progress.addEventListener('input', () => {
                const percentage = progress.value / 100;
                const target = Math.round(percentage * this.totalPages);
                if (target >= 0 && target <= this.totalPages) {
                    this.goToPage(target);
                }
            });
        }
    }

    /**
     * 初始化主题
     * @protected
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
     * 注册事件监听器
     * @param {string} event - 事件名称
     * @param {Function} handler - 事件处理函数
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }

    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} handler - 事件处理函数
     */
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).delete(handler);
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     */
    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`事件处理错误 [${event}]:`, error);
                }
            });
        }
    }

    /**
     * 处理错误
     * @param {Error} error - 错误对象
     */
    handleError(error) {
        console.error(`[${this.constructor.name}] 错误:`, error);
        this.emit('error', {
            error,
            message: error.message,
            code: error.code
        });
        this.showError(error.message);
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.eventHandlers.clear();
        if (this.loadingElement && this.loadingElement.parentNode) {
            this.loadingElement.parentNode.removeChild(this.loadingElement);
        }
    }

    /**
     * 加载内容（需要子类实现）
     * @abstract
     */
    async load() {
        throw new Error('需要子类实现 load 方法');
    }

    /**
     * 设置主题（需要子类实现）
     * @abstract
     */
    setTheme() {
        throw new Error('需要子类实现 setTheme 方法');
    }

    /**
     * 设置字体大小（需要子类实现）
     * @abstract
     */
    setFontSize() {
        throw new Error('需要子类实现 setFontSize 方法');
    }

    /**
     * 跳转到指定章节（需要子类实现）
     * @abstract
     */
    goToChapter() {
        throw new Error('需要子类实现 goToChapter 方法');
    }

    prev() {
        throw new Error('需要子类实现 prev 方法');
    }

    next() {
        throw new Error('需要子类实现 next 方法');
    }
} 