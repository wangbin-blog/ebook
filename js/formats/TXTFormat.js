import { BaseFormat } from './BaseFormat.js';
import { ERROR_CODES } from '../config/constants.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * TXT 格式处理器类
 * 负责处理 TXT 格式的电子书
 * @extends BaseFormat
 */
export class TXTFormat extends BaseFormat {
    /**
     * 创建 TXT 处理器实例
     * @param {HTMLElement} container - 渲染容器
     */
    constructor(container) {
        super(container);
        this.text = '';
        this.pages = [];
        this.pageSize = 3000; // 每页字符数
        this.wrapper = null;
        this.content = null;
    }

    /**
     * 加载 TXT 内容
     * @param {Response} response - fetch响应对象
     * @returns {Promise<void>}
     */
    async load(response) {
        try {
            this.showLoading();

            // 检测编码并读取文本
            const buffer = await response.arrayBuffer();
            this.text = await this.detectAndDecode(buffer);

            // 分页
            this.pages = this.paginateText(this.text);
            this.totalPages = this.pages.length;

            // 创建阅读���器
            this.createContainer();

            // 渲染第一页
            await this.render();

            this.hideLoading();
        } catch (error) {
            this.handleError(error);
            throw ErrorHandler.createError('TXT加载失败', ERROR_CODES.LOAD_FAILED);
        }
    }

    /**
     * 检测编码并解码文本
     * @private
     * @param {ArrayBuffer} buffer - 文件内容
     * @returns {Promise<string>} 解码后的文本
     */
    async detectAndDecode(buffer) {
        // 尝试检测编码
        const testBytes = new Uint8Array(buffer.slice(0, 4));
        let encoding = 'utf-8';

        // 检测 BOM
        if (testBytes[0] === 0xEF && testBytes[1] === 0xBB && testBytes[2] === 0xBF) {
            encoding = 'utf-8';
        } else if (testBytes[0] === 0xFF && testBytes[1] === 0xFE) {
            encoding = 'utf-16le';
        } else if (testBytes[0] === 0xFE && testBytes[1] === 0xFF) {
            encoding = 'utf-16be';
        } else {
            // 尝试检测中文编码
            try {
                const gbkDecoder = new TextDecoder('gbk');
                const text = gbkDecoder.decode(buffer);
                if (text.includes('�')) {
                    encoding = 'utf-8';
                } else {
                    encoding = 'gbk';
                }
            } catch {
                encoding = 'utf-8';
            }
        }

        // 解码文本
        const decoder = new TextDecoder(encoding);
        return decoder.decode(buffer);
    }

    /**
     * 文本分页
     * @private
     * @param {string} text - 要分页的文本
     * @returns {Array<string>} 分页后的文本数组
     */
    paginateText(text) {
        const pages = [];
        let currentPage = '';
        let currentSize = 0;

        // 按段落分割
        const paragraphs = text.split(/\r?\n/);

        for (const paragraph of paragraphs) {
            const trimmedParagraph = paragraph.trim();
            if (!trimmedParagraph) continue;

            const paragraphWithNewline = trimmedParagraph + '\n\n';

            if (currentSize + paragraphWithNewline.length > this.pageSize) {
                if (currentPage) {
                    pages.push(currentPage);
                    currentPage = '';
                    currentSize = 0;
                }
            }

            currentPage += paragraphWithNewline;
            currentSize += paragraphWithNewline.length;

            if (currentSize >= this.pageSize) {
                pages.push(currentPage);
                currentPage = '';
                currentSize = 0;
            }
        }

        if (currentPage) {
            pages.push(currentPage);
        }

        return pages;
    }

    /**
     * 创建阅读容器
     * @private
     */
    createContainer() {
        // 创建外层容器
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'txt-reader-wrapper';
        this.wrapper.style.cssText = `
            width: 100%;
            height: 100%;
            overflow: hidden;
            position: relative;
        `;

        // 创建内容容器
        this.content = document.createElement('div');
        this.content.className = 'txt-reader-content';
        this.content.style.cssText = `
            padding: 20px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
        `;

        this.wrapper.appendChild(this.content);
        this.container.appendChild(this.wrapper);

        // 添加触摸和键盘事件监听
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     * @private
     */
    setupEventListeners() {
        // 键盘导航
        this.addEventListenerWithCleanup(document, 'keyup', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    this.prevPage();
                    break;
                case 'ArrowRight':
                    this.nextPage();
                    break;
                case 'Home':
                    this.goToPage(1);
                    break;
                case 'End':
                    this.goToPage(this.totalPages);
                    break;
            }
        });

        // 触摸导航
        let touchStart = null;
        this.addEventListenerWithCleanup(this.wrapper, 'touchstart', (e) => {
            touchStart = e.changedTouches[0].screenX;
        });

        this.addEventListenerWithCleanup(this.wrapper, 'touchend', (e) => {
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
            if (!this.content || this.currentPage > this.totalPages) {
                throw new Error('Invalid page');
            }

            const pageContent = this.pages[this.currentPage - 1];
            this.content.textContent = pageContent;

            // 滚动到顶部
            this.wrapper.scrollTop = 0;
        } catch (error) {
            this.handleError(error);
            throw ErrorHandler.createError('TXT渲染失败', ERROR_CODES.RENDER_ERROR);
        }
    }

    /**
     * 设置字体大小
     * @param {string} size - 字体大小
     */
    setFontSize(size) {
        if (this.content) {
            this.content.style.fontSize = size;
        }
    }

    /**
     * 设置行高
     * @param {string} height - 行高
     */
    setLineHeight(height) {
        if (this.content) {
            this.content.style.lineHeight = height;
        }
    }

    /**
     * 设置字体
     * @param {string} family - 字体名称
     */
    setFont(family) {
        if (this.content) {
            this.content.style.fontFamily = family;
        }
    }

    /**
     * 搜索文本
     * @param {string} query - 搜索关键词
     * @returns {Array} 搜索结果
     */
    search(query) {
        const results = [];
        const regex = new RegExp(query, 'gi');

        this.pages.forEach((content, pageIndex) => {
            let match;
            while ((match = regex.exec(content)) !== null) {
                results.push({
                    page: pageIndex + 1,
                    position: match.index,
                    text: match[0],
                    context: content.substr(Math.max(0, match.index - 50), 100)
                });
            }
        });

        return results;
    }

    /**
     * 清理资源
     */
    cleanup() {
        super.cleanup();
        this.text = '';
        this.pages = [];
        this.wrapper = null;
        this.content = null;
    }
} 