import { BaseComponent } from './components/BaseComponent.js';
import { READER_CONSTANTS } from './config/constants.js';
import { ErrorHandler } from './utils/ErrorHandler.js';

/**
 * 阅读器核心类
 * 负责管理阅读器的核心功能
 * @extends BaseComponent
 */
export class BookReader extends BaseComponent {
    /**
     * 创建阅读器实例
     * @param {HTMLElement} container - 阅读器容器元素
     */
    constructor(container) {
        super();
        this.container = container;
        this.currentPage = 1;
        this.totalPages = 1;
        this.zoom = 1.0;
        this.format = null;
        this.content = null;

        // 初始化错误处理
        ErrorHandler.init();
        ErrorHandler.addErrorListener(this.handleError.bind(this));
    }

    /**
     * 加载书籍
     * @param {string} url - 书籍文件URL
     * @param {string} format - 书籍格式
     * @returns {Promise<void>}
     */
    async loadBook(url, format) {
        try {
            this.format = format;
            this.showLoading();

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.content = await this.loadContent(response, format);
            await this.renderContent();

            this.hideLoading();
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 根据格式加载内容
     * @private
     * @param {Response} response - fetch响应对象
     * @param {string} format - 文件格式
     * @returns {Promise<any>} 解析后的内容
     */
    async loadContent(response, format) {
        switch (format.toLowerCase()) {
            case 'pdf':
                return this.loadPDF(response);
            case 'epub':
                return this.loadEPUB(response);
            case 'txt':
                return this.loadText(response);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * 渲染内容
     * @private
     * @returns {Promise<void>}
     */
    async renderContent() {
        if (!this.content) {
            throw new Error('No content to render');
        }

        switch (this.format.toLowerCase()) {
            case 'pdf':
                await this.renderPDF();
                break;
            case 'epub':
                await this.renderEPUB();
                break;
            case 'txt':
                await this.renderText();
                break;
        }
    }

    /**
     * 显示加载状态
     * @private
     */
    showLoading() {
        this.container.innerHTML = '';
        this.container.appendChild(this.createLoadingElement('加载中...'));
    }

    /**
     * 隐藏加载状态
     * @private
     */
    hideLoading() {
        const loading = this.container.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * 处理错误
     * @private
     * @param {Error} error - 错误对象
     */
    handleError(error) {
        console.error('Reader error:', error);
        this.container.innerHTML = '';
        this.container.appendChild(this.createErrorElement(`加载失败：${error.message}`));
    }

    /**
     * 获取当前位置
     * @returns {number} 当前位置
     */
    getCurrentPosition() {
        return this.currentPage;
    }

    /**
     * 跳转到指定位置
     * @param {number} position - 目标位置
     * @returns {Promise<void>}
     */
    async goToPosition(position) {
        if (position >= 1 && position <= this.totalPages) {
            this.currentPage = position;
            await this.renderContent();
        }
    }

    /**
     * 上一页
     * @returns {Promise<void>}
     */
    async prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.renderContent();
        }
    }

    /**
     * 下一页
     * @returns {Promise<void>}
     */
    async nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            await this.renderContent();
        }
    }

    /**
     * 放大
     */
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 3.0);
        this.applyZoom();
    }

    /**
     * 缩小
     */
    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.5);
        this.applyZoom();
    }

    /**
     * 应用缩放
     * @private
     */
    applyZoom() {
        const content = this.container.firstElementChild;
        if (content) {
            content.style.transform = `scale(${this.zoom})`;
            content.style.transformOrigin = 'top center';
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        super.cleanup();
        ErrorHandler.removeErrorListener(this.handleError);
        this.content = null;
    }
} 