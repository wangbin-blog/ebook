import { BaseComponent } from './BaseComponent.js';
import { STORAGE_KEYS } from '../config/constants.js';
import { safeJSONParse, generateUniqueId } from '../utils/helpers.js';

/**
 * 书签管理类
 * 负责管理和保存书签信息
 * @extends BaseComponent
 */
export class Bookmark extends BaseComponent {
    /**
     * 创建书签管理实例
     * @param {string} bookId - 图书ID
     */
    constructor(bookId) {
        super();
        this.bookId = bookId;
        this.bookmarks = [];
        this.loadBookmarks();
    }

    /**
     * 加载书签
     * @private
     */
    loadBookmarks() {
        const key = `${STORAGE_KEYS.BOOKMARKS}_${this.bookId}`;
        this.bookmarks = safeJSONParse(localStorage.getItem(key), []);
    }

    /**
     * 保存书签
     * @private
     */
    saveBookmarks() {
        try {
            const key = `${STORAGE_KEYS.BOOKMARKS}_${this.bookId}`;
            localStorage.setItem(key, JSON.stringify(this.bookmarks));
        } catch (error) {
            console.error('Failed to save bookmarks:', error);
        }
    }

    /**
     * 添加书签
     * @param {number} page - 页码
     * @param {string} title - 书签标题
     * @param {string} [note] - 书签备注
     * @returns {Object} 新添加的书签对象
     */
    addBookmark(page, title, note = '') {
        const bookmark = {
            id: generateUniqueId(),
            page,
            title: title.trim(),
            note: note.trim(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // 检查是否已存在相同页码的书签
        const existingIndex = this.bookmarks.findIndex(b => b.page === page);
        if (existingIndex !== -1) {
            // 更新现有书签
            this.bookmarks[existingIndex] = {
                ...this.bookmarks[existingIndex],
                title: bookmark.title,
                note: bookmark.note,
                updatedAt: bookmark.updatedAt
            };
        } else {
            // 添加新书签
            this.bookmarks.push(bookmark);
            // 按页码排序
            this.bookmarks.sort((a, b) => a.page - b.page);
        }

        this.saveBookmarks();
        return bookmark;
    }

    /**
     * 删除书签
     * @param {string} id - 书签ID
     * @returns {boolean} 是否成功删除
     */
    removeBookmark(id) {
        const initialLength = this.bookmarks.length;
        this.bookmarks = this.bookmarks.filter(bookmark => bookmark.id !== id);

        if (this.bookmarks.length !== initialLength) {
            this.saveBookmarks();
            return true;
        }
        return false;
    }

    /**
     * 更新书签
     * @param {string} id - 书签ID
     * @param {Object} updates - 更新内容
     * @returns {boolean} 是否成功更新
     */
    updateBookmark(id, updates) {
        const index = this.bookmarks.findIndex(bookmark => bookmark.id === id);
        if (index !== -1) {
            this.bookmarks[index] = {
                ...this.bookmarks[index],
                ...updates,
                updatedAt: Date.now()
            };
            this.saveBookmarks();
            return true;
        }
        return false;
    }

    /**
     * 获取所有书签
     * @returns {Array} 书签数组
     */
    getBookmarks() {
        return [...this.bookmarks];
    }

    /**
     * 获取指定页的书签
     * @param {number} page - 页码
     * @returns {Object|null} 书签对象或null
     */
    getBookmarkByPage(page) {
        return this.bookmarks.find(bookmark => bookmark.page === page) || null;
    }

    /**
     * 创建书签面板
     * @param {number} currentPage - 当前页码
     * @returns {HTMLElement} 书签面板元素
     */
    createBookmarkPanel(currentPage) {
        const panel = this.createElement('div', 'bookmark-panel');
        const currentBookmark = this.getBookmarkByPage(currentPage);

        panel.innerHTML = `
            <div class="bookmark-header">
                <h3>书签管理</h3>
                <button class="add-bookmark-btn ${currentBookmark ? 'active' : ''}" data-page="${currentPage}">
                    ${currentBookmark ? '编辑书签' : '添加书签'}
                </button>
            </div>
            <div class="bookmark-form" style="display: none;">
                <div class="form-group">
                    <label>标题</label>
                    <input type="text" class="bookmark-title" value="${currentBookmark?.title || ''}" placeholder="输入书签标题">
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea class="bookmark-note" placeholder="添加备注（可选）">${currentBookmark?.note || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button class="save-bookmark-btn">保存</button>
                    ${currentBookmark ? '<button class="delete-bookmark-btn">删除</button>' : ''}
                    <button class="cancel-bookmark-btn">取消</button>
                </div>
            </div>
            <div class="bookmarks-list">
                ${this.bookmarks.map(bookmark => `
                    <div class="bookmark-item ${bookmark.page === currentPage ? 'current' : ''}" data-id="${bookmark.id}">
                        <div class="bookmark-info">
                            <div class="bookmark-title">${bookmark.title}</div>
                            ${bookmark.note ? `<div class="bookmark-note">${bookmark.note}</div>` : ''}
                            <div class="bookmark-page">第 ${bookmark.page} 页</div>
                        </div>
                        <div class="bookmark-actions">
                            <button class="goto-bookmark-btn" data-page="${bookmark.page}">跳转</button>
                            <button class="edit-bookmark-btn">编辑</button>
                            <button class="remove-bookmark-btn" data-id="${bookmark.id}">删除</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.attachBookmarkListeners(panel, currentPage);
        return panel;
    }

    /**
     * 添加书签面板事件监听
     * @private
     * @param {HTMLElement} panel - 书签面板元素
     * @param {number} currentPage - 当前页码
     */
    attachBookmarkListeners(panel, currentPage) {
        // 添加/编辑书签按钮
        const addBtn = panel.querySelector('.add-bookmark-btn');
        const form = panel.querySelector('.bookmark-form');
        const titleInput = panel.querySelector('.bookmark-title');
        const noteInput = panel.querySelector('.bookmark-note');

        this.addEventListenerWithCleanup(addBtn, 'click', () => {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
            if (form.style.display === 'block') {
                titleInput.focus();
            }
        });

        // 保存书签
        const saveBtn = panel.querySelector('.save-bookmark-btn');
        this.addEventListenerWithCleanup(saveBtn, 'click', () => {
            const title = titleInput.value.trim();
            if (title) {
                this.addBookmark(currentPage, title, noteInput.value);
                form.style.display = 'none';
                this.dispatchEvent(new CustomEvent('bookmarkUpdated'));
            }
        });

        // 取消按钮
        const cancelBtn = panel.querySelector('.cancel-bookmark-btn');
        this.addEventListenerWithCleanup(cancelBtn, 'click', () => {
            form.style.display = 'none';
        });

        // 删除书签按钮
        const deleteBtn = panel.querySelector('.delete-bookmark-btn');
        if (deleteBtn) {
            this.addEventListenerWithCleanup(deleteBtn, 'click', () => {
                const bookmark = this.getBookmarkByPage(currentPage);
                if (bookmark && confirm('确定要删除这个书签吗？')) {
                    this.removeBookmark(bookmark.id);
                    form.style.display = 'none';
                    this.dispatchEvent(new CustomEvent('bookmarkUpdated'));
                }
            });
        }

        // 书签列表事件
        const bookmarksList = panel.querySelector('.bookmarks-list');
        this.addEventListenerWithCleanup(bookmarksList, 'click', (e) => {
            const target = e.target;

            // 跳转按钮
            if (target.classList.contains('goto-bookmark-btn')) {
                const page = parseInt(target.dataset.page);
                this.dispatchEvent(new CustomEvent('gotoBookmark', { detail: { page } }));
            }

            // 编辑按钮
            else if (target.classList.contains('edit-bookmark-btn')) {
                const item = target.closest('.bookmark-item');
                const bookmark = this.bookmarks.find(b => b.id === item.dataset.id);
                if (bookmark) {
                    titleInput.value = bookmark.title;
                    noteInput.value = bookmark.note;
                    form.style.display = 'block';
                    titleInput.focus();
                }
            }

            // 删除按钮
            else if (target.classList.contains('remove-bookmark-btn')) {
                const id = target.dataset.id;
                if (confirm('确定要删除这个书签吗？')) {
                    this.removeBookmark(id);
                    this.dispatchEvent(new CustomEvent('bookmarkUpdated'));
                }
            }
        });
    }

    /**
     * 清理资源
     */
    cleanup() {
        super.cleanup();
        this.saveBookmarks();
    }
} 