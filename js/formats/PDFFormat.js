import { BaseFormat } from './BaseFormat.js';
import { ERROR_CODES } from '../config/constants.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * PDF 格式处理器类
 * 负责处理 PDF 格式的电子书
 * @extends BaseFormat
 */
export class PDFFormat extends BaseFormat {
    /**
     * 创建 PDF 处理器实例
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
    }

    /**
     * 加载 PDF 内容
     * @param {Response} response - fetch响应对象
     * @returns {Promise<void>}
     */
    async load(response) {
        try {
            this.showLoading();

            // 加载 PDF.js 库
            if (!window.pdfjsLib) {
                await this.loadPDFJS();
            }

            const arrayBuffer = await response.arrayBuffer();
            this.pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
            this.totalPages = this.pdf.numPages;

            // 创建画布
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.container.appendChild(this.canvas);

            // 渲染第一页
            await this.render();

            this.hideLoading();
        } catch (error) {
            this.handleError(error);
            throw ErrorHandler.createError('PDF加载失败', ERROR_CODES.LOAD_FAILED);
        }
    }

    /**
     * 加载 PDF.js 库
     * @private
     * @returns {Promise<void>}
     */
    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load PDF.js'));
            document.head.appendChild(script);
        });
    }

    /**
     * 渲染页面
     * @returns {Promise<void>}
     */
    async render() {
        if (this.pageRendering) {
            this.pageNumPending = this.currentPage;
            return;
        }

        try {
            this.pageRendering = true;
            const page = await this.pdf.getPage(this.currentPage);

            // 计算合适的缩放比例
            const viewport = page.getViewport({ scale: this.scale, rotation: this.rotation });
            const containerWidth = this.container.clientWidth;
            const containerHeight = this.container.clientHeight;

            // 调整画布大小以适应容器
            const containerRatio = containerWidth / containerHeight;
            const pageRatio = viewport.width / viewport.height;

            let width = viewport.width;
            let height = viewport.height;

            if (pageRatio > containerRatio) {
                width = containerWidth;
                height = width / pageRatio;
            } else {
                height = containerHeight;
                width = height * pageRatio;
            }

            const scale = width / viewport.width;
            const scaledViewport = page.getViewport({ scale, rotation: this.rotation });

            // 设置画布尺寸
            this.canvas.width = scaledViewport.width;
            this.canvas.height = scaledViewport.height;

            // 渲染PDF页面
            const renderContext = {
                canvasContext: this.ctx,
                viewport: scaledViewport
            };

            await page.render(renderContext).promise;
            this.pageRendering = false;

            if (this.pageNumPending !== null) {
                const pendingPage = this.pageNumPending;
                this.pageNumPending = null;
                await this.goToPage(pendingPage);
            }
        } catch (error) {
            this.pageRendering = false;
            this.handleError(error);
            throw ErrorHandler.createError('PDF渲染失败', ERROR_CODES.RENDER_ERROR);
        }
    }

    /**
     * 设置缩放比例
     * @param {number} scale - 缩放比例
     * @returns {Promise<void>}
     */
    async setScale(scale) {
        if (scale >= 0.5 && scale <= 3.0) {
            this.scale = scale;
            await this.render();
        }
    }

    /**
     * 设置旋转角度
     * @param {number} rotation - 旋转角度（0, 90, 180, 270）
     * @returns {Promise<void>}
     */
    async setRotation(rotation) {
        if ([0, 90, 180, 270].includes(rotation)) {
            this.rotation = rotation;
            await this.render();
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        super.cleanup();
        if (this.pdf) {
            this.pdf.destroy();
            this.pdf = null;
        }
        this.canvas = null;
        this.ctx = null;
    }
} 