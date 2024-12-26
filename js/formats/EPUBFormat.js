import { BaseFormat } from './BaseFormat.js';
import { ERROR_CODES } from '../config/constants.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * EPUB 格式处理器类
 * 负责处理 EPUB 格式的电子书
 * @extends BaseFormat
 */
export class EPUBFormat extends BaseFormat {
    /**
     * 创建 EPUB 处理器实例
     * @param {HTMLElement} container - 渲染容器
     */
    constructor(container) {
        super(container);
        this.book = null;
        this.rendition = null;
        this.displayed = null;
        this.toc = [];
    }

    /**
     * 加载 EPUB 内容
     * @param {Response} response - fetch响应对象
     * @returns {Promise<void>}
     */
    async load(response) {
        try {
            this.showLoading();

            // 加载 ePub.js 库
            if (!window.ePub) {
                await this.loadEPUBJS();
            }

            const arrayBuffer = await response.arrayBuffer();
            this.book = window.ePub(arrayBuffer);

            // 创建渲染器
            this.rendition = this.book.renderTo(this.container, {
                width: '100%',
                height: '100%',
                spread: 'none'
            });

            // 加载目录
            this.toc = await this.book.loaded.navigation.then(nav => {
                return nav.toc;
            });

            // 初始化定位
            await this.book.ready;
            await this.rendition.display();

            // 设置事件监听
            this.setupEventListeners();

            this.hideLoading();
        } catch (error) {
            this.handleError(error);
            throw ErrorHandler.createError('EPUB加载失败', ERROR_CODES.LOAD_FAILED);
        }
    }

    /**
     * 加载 ePub.js 库
     * @private
     * @returns {Promise<void>}
     */
    async loadEPUBJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/epub.js/0.3.93/epub.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load ePub.js'));
            document.head.appendChild(script);
        });
    }

    /**
     * 设置事件监听器
     * @private
     */
    setupEventListeners() {
        // 页面变化事件
        this.rendition.on('rendered', (section) => {
            this.currentPage = section.index + 1;
            this.totalPages = this.book.spine.length;
        });

        // 键盘导航
        this.addEventListenerWithCleanup(document, 'keyup', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    this.prevPage();
                    break;
                case 'ArrowRight':
                    this.nextPage();
                    break;
            }
        });

        // 触摸导航
        let touchStart = null;
        this.addEventListenerWithCleanup(this.container, 'touchstart', (e) => {
            touchStart = e.changedTouches[0].screenX;
        });

        this.addEventListenerWithCleanup(this.container, 'touchend', (e) => {
            if (!touchStart) return;

            const touchEnd = e.changedTouches[0].screenX;
            const delta = touchEnd - touchStart;

            if (Math.abs(delta) > 50) {
                if (delta > 0) {
                    this.prevPage();
                } else {
                    this.nextPage();
                }
            }
            touchStart = null;
        });
    }

    /**
     * 渲染内容
     * @returns {Promise<void>}
     */
    async render() {
        try {
            if (!this.book || !this.rendition) {
                throw new Error('EPUB not initialized');
            }

            const location = this.book.spine.get(this.currentPage - 1);
            if (location) {
                await this.rendition.display(location.href);
            }
        } catch (error) {
            this.handleError(error);
            throw ErrorHandler.createError('EPUB渲染失败', ERROR_CODES.RENDER_ERROR);
        }
    }

    /**
     * 获取目录
     * @returns {Array} 目录数组
     */
    getTOC() {
        return this.toc;
    }

    /**
     * 跳转到指定章节
     * @param {string} href - 章节链接
     * @returns {Promise<void>}
     */
    async goToChapter(href) {
        try {
            await this.rendition.display(href);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 设置字体大小
     * @param {string} size - 字体大小
     */
    setFontSize(size) {
        if (this.rendition) {
            this.rendition.themes.fontSize(size);
        }
    }

    /**
     * 设置字体
     * @param {string} family - 字体名称
     */
    setFont(family) {
        if (this.rendition) {
            this.rendition.themes.font(family);
        }
    }

    /**
     * 设置主题
     * @param {Object} theme - 主题配置
     */
    setTheme(theme) {
        if (this.rendition) {
            this.rendition.themes.register(theme.name, theme);
            this.rendition.themes.select(theme.name);
        }
    }

    /**
     * 搜索文本
     * @param {string} query - 搜索关键词
     * @returns {Promise<Array>} 搜索结果
     */
    async search(query) {
        try {
            return await this.book.spine.search(query);
        } catch (error) {
            this.handleError(error);
            return [];
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        super.cleanup();
        if (this.rendition) {
            this.rendition.destroy();
        }
        if (this.book) {
            this.book.destroy();
        }
        this.book = null;
        this.rendition = null;
        this.displayed = null;
        this.toc = [];
    }
} 