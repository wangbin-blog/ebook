import { BaseComponent } from '../components/BaseComponent.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { ERROR_CODES } from '../config/constants.js';
import { ReadingProgress } from '../components/ReadingProgress.js';
import { Bookmark } from '../components/Bookmark.js';
import { Note } from '../components/Note.js';

/**
 * 基础格式处理器类
 * 为所有具体格式处理器提供基础功能
 * @extends BaseComponent
 */
export class BaseFormat extends BaseComponent {
    /**
     * 创建格式处理器实例
     * @param {HTMLElement} container - 渲染容器
     * @param {string} bookId - 图书ID
     */
    constructor(container, bookId) {
        super();
        this.container = container;
        this.content = null;
        this.currentPage = 1;
        this.totalPages = 1;
        this.isLoading = false;

        // 初始化阅读进度管理
        this.progress = new ReadingProgress(bookId);

        // 初始化书签管理
        this.bookmark = new Bookmark(bookId);
        this.bookmark.addEventListener('gotoBookmark', this.handleGotoBookmark.bind(this));
        this.bookmark.addEventListener('bookmarkUpdated', this.handleBookmarkUpdated.bind(this));

        // 初始化笔记管理
        this.note = new Note(bookId);
        this.note.addEventListener('noteUpdated', this.handleNoteUpdated.bind(this));

        // 从进度管理器恢复上次阅读位置
        this.currentPage = this.progress.getLastPosition();
    }

    /**
     * 加载内容
     * @param {Response} response - fetch响应对象
     * @returns {Promise<void>}
     */
    async load(response) {
        throw new Error('Method not implemented');
    }

    /**
     * 渲染内容
     * @returns {Promise<void>}
     */
    async render() {
        throw new Error('Method not implemented');
    }

    /**
     * 跳转到指定页
     * @param {number} pageNumber - 目标页码
     * @returns {Promise<void>}
     */
    async goToPage(pageNumber) {
        if (pageNumber >= 1 && pageNumber <= this.totalPages) {
            this.currentPage = pageNumber;
            await this.render();
            // 更新阅读进度
            this.progress.updateProgress(this.currentPage, this.totalPages);
        }
    }

    /**
     * 上一页
     * @returns {Promise<void>}
     */
    async prevPage() {
        if (this.currentPage > 1) {
            await this.goToPage(this.currentPage - 1);
        }
    }

    /**
     * 下一页
     * @returns {Promise<void>}
     */
    async nextPage() {
        if (this.currentPage < this.totalPages) {
            await this.goToPage(this.currentPage + 1);
        }
    }

    /**
     * 获取当前��码
     * @returns {number} 当前页码
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * 获取总页数
     * @returns {number} 总页数
     */
    getTotalPages() {
        return this.totalPages;
    }

    /**
     * 获取加载进度
     * @returns {number} 加载进度（0-100）
     */
    getLoadingProgress() {
        return this.isLoading ? Math.round((this.currentPage / this.totalPages) * 100) : 100;
    }

    /**
     * 获取阅读进度
     * @returns {number} 阅读进度（0-100）
     */
    getReadingProgress() {
        return this.progress.getProgress();
    }

    /**
     * 获取阅读时间
     * @returns {string} 格式化的阅读时间
     */
    getReadingTime() {
        return this.progress.getReadingTime();
    }

    /**
     * 添加书签
     * @param {string} title - 书签标题
     * @param {string} [note] - 书签备注
     * @returns {Object} 新添加的书签对象
     */
    addBookmark(title, note) {
        return this.bookmark.addBookmark(this.currentPage, title, note);
    }

    /**
     * 删除书签
     * @param {string} id - 书签ID
     * @returns {boolean} 是否成功删除
     */
    removeBookmark(id) {
        return this.bookmark.removeBookmark(id);
    }

    /**
     * 获取当前���的书签
     * @returns {Object|null} 书签对象或null
     */
    getCurrentPageBookmark() {
        return this.bookmark.getBookmarkByPage(this.currentPage);
    }

    /**
     * 获取所有书签
     * @returns {Array} 书签数组
     */
    getBookmarks() {
        return this.bookmark.getBookmarks();
    }

    /**
     * 添加笔记
     * @param {string} content - 笔记内容
     * @param {string} [selectedText] - 选中的文本
     * @param {string} [color] - 高亮颜色
     * @returns {Object} 新添加的笔记对象
     */
    addNote(content, selectedText, color) {
        return this.note.addNote(this.currentPage, content, selectedText, color);
    }

    /**
     * 删除笔记
     * @param {string} id - 笔记ID
     * @returns {boolean} 是否成功删除
     */
    removeNote(id) {
        return this.note.removeNote(id);
    }

    /**
     * 更新笔记
     * @param {string} id - 笔记ID
     * @param {Object} updates - 更新内容
     * @returns {boolean} 是否成功更新
     */
    updateNote(id, updates) {
        return this.note.updateNote(id, updates);
    }

    /**
     * 获取当前页的笔记
     * @returns {Array} 笔记数组
     */
    getCurrentPageNotes() {
        return this.note.getNotesByPage(this.currentPage);
    }

    /**
     * 获取所有笔记
     * @returns {Array} 笔记数组
     */
    getNotes() {
        return this.note.getNotes();
    }

    /**
     * 处理跳转到书签事件
     * @private
     * @param {CustomEvent} event - 事件对象
     */
    handleGotoBookmark(event) {
        const { page } = event.detail;
        this.goToPage(page);
    }

    /**
     * 处理书签更新事件
     * @private
     */
    handleBookmarkUpdated() {
        // 触发自定义事件通知上层组件
        this.dispatchEvent(new CustomEvent('bookmarksChanged', {
            detail: {
                bookmarks: this.getBookmarks()
            }
        }));
    }

    /**
     * 处理笔记更新事件
     * @private
     */
    handleNoteUpdated() {
        // 触发自定义事件通知上层组件
        this.dispatchEvent(new CustomEvent('notesChanged', {
            detail: {
                notes: this.getCurrentPageNotes()
            }
        }));
    }

    /**
     * 显示加载状态
     * @protected
     */
    showLoading() {
        this.isLoading = true;
        this.container.innerHTML = '';
        this.container.appendChild(this.createLoadingElement('加载中...'));
    }

    /**
     * 隐藏加载状态
     * @protected
     */
    hideLoading() {
        this.isLoading = false;
        const loading = this.container.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * 处理错误
     * @protected
     * @param {Error} error - 错误对象
     */
    handleError(error) {
        console.error('Format handler error:', error);
        this.container.innerHTML = '';
        this.container.appendChild(this.createErrorElement(`加载失败：${error.message}`));
        ErrorHandler.handleError(error);
    }

    /**
     * 创建进度面板
     * @returns {HTMLElement} 进度面板元素
     */
    createProgressPanel() {
        return this.progress.createProgressPanel();
    }

    /**
     * 创建书签面板
     * @returns {HTMLElement} 书签面板元素
     */
    createBookmarkPanel() {
        return this.bookmark.createBookmarkPanel(this.currentPage);
    }

    /**
     * 创建笔记面板
     * @returns {HTMLElement} 笔记面板元素
     */
    createNotePanel() {
        return this.note.createNotePanel(this.currentPage);
    }

    /**
     * 清理资源
     */
    cleanup() {
        super.cleanup();
        if (this.progress) {
            this.progress.cleanup();
        }
        if (this.bookmark) {
            this.bookmark.cleanup();
        }
        if (this.note) {
            this.note.cleanup();
        }
        this.content = null;
        this.container.innerHTML = '';
    }
} 