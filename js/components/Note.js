import { BaseComponent } from './BaseComponent.js';
import { STORAGE_KEYS } from '../config/constants.js';
import { safeJSONParse, generateUniqueId } from '../utils/helpers.js';

/**
 * 笔记管理类
 * 负责管理和保存笔记信息
 * @extends BaseComponent
 */
export class Note extends BaseComponent {
    /**
     * 创建笔记管理实例
     * @param {string} bookId - 图书ID
     */
    constructor(bookId) {
        super();
        this.bookId = bookId;
        this.notes = [];
        this.loadNotes();
    }

    /**
     * 加载笔记
     * @private
     */
    loadNotes() {
        const key = `${STORAGE_KEYS.NOTES}_${this.bookId}`;
        this.notes = safeJSONParse(localStorage.getItem(key), []);
    }

    /**
     * 保存笔记
     * @private
     */
    saveNotes() {
        try {
            const key = `${STORAGE_KEYS.NOTES}_${this.bookId}`;
            localStorage.setItem(key, JSON.stringify(this.notes));
        } catch (error) {
            console.error('Failed to save notes:', error);
        }
    }

    /**
     * 添加笔记
     * @param {number} page - 页码
     * @param {string} content - 笔记内容
     * @param {string} [selectedText] - 选中的文本
     * @param {string} [color] - 高亮颜色
     * @returns {Object} 新添加的笔记对象
     */
    addNote(page, content, selectedText = '', color = '#ffeb3b') {
        const note = {
            id: generateUniqueId(),
            page,
            content: content.trim(),
            selectedText: selectedText.trim(),
            color,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.notes.push(note);
        // 按页码和创建时间排序
        this.notes.sort((a, b) => a.page - b.page || a.createdAt - b.createdAt);
        this.saveNotes();

        return note;
    }

    /**
     * 删除笔记
     * @param {string} id - 笔记ID
     * @returns {boolean} 是否成功删除
     */
    removeNote(id) {
        const initialLength = this.notes.length;
        this.notes = this.notes.filter(note => note.id !== id);

        if (this.notes.length !== initialLength) {
            this.saveNotes();
            return true;
        }
        return false;
    }

    /**
     * 更新笔记
     * @param {string} id - 笔记ID
     * @param {Object} updates - 更新内容
     * @returns {boolean} 是否成功更新
     */
    updateNote(id, updates) {
        const index = this.notes.findIndex(note => note.id === id);
        if (index !== -1) {
            this.notes[index] = {
                ...this.notes[index],
                ...updates,
                updatedAt: Date.now()
            };
            this.saveNotes();
            return true;
        }
        return false;
    }

    /**
     * 获取所有笔记
     * @returns {Array} 笔记数组
     */
    getNotes() {
        return [...this.notes];
    }

    /**
     * 获取指定页的笔记
     * @param {number} page - 页码
     * @returns {Array} 笔记数组
     */
    getNotesByPage(page) {
        return this.notes.filter(note => note.page === page);
    }

    /**
     * 导出笔记
     * @returns {string} 导出的JSON字符串
     */
    exportNotes() {
        const exportData = {
            bookId: this.bookId,
            notes: this.notes,
            exportTime: Date.now(),
            version: '1.0'
        };
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 导入笔记
     * @param {string} jsonData - 要导入的JSON字符串
     * @returns {boolean} 是否成功导入
     */
    importNotes(jsonData) {
        try {
            const importData = JSON.parse(jsonData);

            // 验证导入数据的格式
            if (!importData.notes || !Array.isArray(importData.notes)) {
                throw new Error('无效的笔记数据格式');
            }

            // 验证每条笔记的必要字段
            const isValidNote = note => {
                return note.id && note.page &&
                    typeof note.content === 'string' &&
                    note.createdAt && note.updatedAt;
            };

            if (!importData.notes.every(isValidNote)) {
                throw new Error('笔记数据不完整');
            }

            // 合并笔记，避免重复
            const existingIds = new Set(this.notes.map(note => note.id));
            const newNotes = importData.notes.filter(note => !existingIds.has(note.id));

            this.notes = [...this.notes, ...newNotes];

            // 按页码和创建时间排序
            this.notes.sort((a, b) => a.page - b.page || a.createdAt - b.createdAt);

            this.saveNotes();
            this.dispatchEvent(new CustomEvent('noteUpdated'));

            return true;
        } catch (error) {
            console.error('导入笔记失败:', error);
            throw new Error(`导入失败: ${error.message}`);
        }
    }

    /**
     * 创建笔记面板
     * @param {number} currentPage - 当前页码
     * @returns {HTMLElement} 笔记面板元素
     */
    createNotePanel(currentPage) {
        const panel = this.createElement('div', 'note-panel');
        const pageNotes = this.getNotesByPage(currentPage);

        panel.innerHTML = `
            <div class="note-header">
                <h3>笔记管理</h3>
                <div class="note-header-actions">
                    <button class="add-note-btn">添加笔记</button>
                    <button class="export-notes-btn">导出笔记</button>
                    <button class="import-notes-btn">导入笔记</button>
                    <input type="file" class="import-notes-input" accept=".json" style="display: none;">
                </div>
            </div>
            <div class="note-form" style="display: none;">
                <div class="form-group">
                    <label>选中文本</label>
                    <div class="selected-text"></div>
                </div>
                <div class="form-group">
                    <label>笔记内容</label>
                    <textarea class="note-content" placeholder="输入笔记内容"></textarea>
                </div>
                <div class="form-group">
                    <label>高亮颜色</label>
                    <input type="color" class="note-color" value="#ffeb3b">
                </div>
                <div class="form-actions">
                    <button class="save-note-btn">保存</button>
                    <button class="cancel-note-btn">取消</button>
                </div>
            </div>
            <div class="notes-list">
                ${pageNotes.map(note => `
                    <div class="note-item" data-id="${note.id}">
                        <div class="note-info">
                            ${note.selectedText ? `
                                <div class="note-selected-text" style="background-color: ${note.color}">
                                    "${note.selectedText}"
                                </div>
                            ` : ''}
                            <div class="note-content">${note.content}</div>
                            <div class="note-meta">
                                <span class="note-page">第 ${note.page} 页</span>
                                <span class="note-time">${new Date(note.updatedAt).toLocaleString()}</span>
                            </div>
                        </div>
                        <div class="note-actions">
                            <button class="edit-note-btn">编辑</button>
                            <button class="remove-note-btn" data-id="${note.id}">删除</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.attachNoteListeners(panel, currentPage);
        this.attachExportImportListeners(panel);
        return panel;
    }

    /**
     * 添加笔记面板事件监听
     * @private
     * @param {HTMLElement} panel - 笔记面板元素
     * @param {number} currentPage - 当前页码
     */
    attachNoteListeners(panel, currentPage) {
        // 添加笔记按钮
        const addBtn = panel.querySelector('.add-note-btn');
        const form = panel.querySelector('.note-form');
        const selectedTextDiv = panel.querySelector('.selected-text');
        const contentInput = panel.querySelector('.note-content');
        const colorInput = panel.querySelector('.note-color');

        this.addEventListenerWithCleanup(addBtn, 'click', () => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            selectedTextDiv.textContent = selectedText;
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
            if (form.style.display === 'block') {
                contentInput.focus();
            }
        });

        // 保存笔记
        const saveBtn = panel.querySelector('.save-note-btn');
        this.addEventListenerWithCleanup(saveBtn, 'click', () => {
            const content = contentInput.value.trim();
            if (content) {
                this.addNote(
                    currentPage,
                    content,
                    selectedTextDiv.textContent,
                    colorInput.value
                );
                form.style.display = 'none';
                contentInput.value = '';
                selectedTextDiv.textContent = '';
                this.dispatchEvent(new CustomEvent('noteUpdated'));
            }
        });

        // 取消按钮
        const cancelBtn = panel.querySelector('.cancel-note-btn');
        this.addEventListenerWithCleanup(cancelBtn, 'click', () => {
            form.style.display = 'none';
            contentInput.value = '';
            selectedTextDiv.textContent = '';
        });

        // 笔记列表事件
        const notesList = panel.querySelector('.notes-list');
        this.addEventListenerWithCleanup(notesList, 'click', (e) => {
            const target = e.target;
            const noteItem = target.closest('.note-item');
            if (!noteItem) return;

            const noteId = noteItem.dataset.id;
            const note = this.notes.find(n => n.id === noteId);
            if (!note) return;

            // 编辑按钮
            if (target.classList.contains('edit-note-btn')) {
                selectedTextDiv.textContent = note.selectedText;
                contentInput.value = note.content;
                colorInput.value = note.color;
                form.style.display = 'block';
                contentInput.focus();

                // 保存编辑
                const saveEdit = () => {
                    const content = contentInput.value.trim();
                    if (content) {
                        this.updateNote(noteId, {
                            content,
                            selectedText: selectedTextDiv.textContent,
                            color: colorInput.value
                        });
                        form.style.display = 'none';
                        contentInput.value = '';
                        selectedTextDiv.textContent = '';
                        this.dispatchEvent(new CustomEvent('noteUpdated'));
                    }
                };

                saveBtn.onclick = saveEdit;
            }

            // 删除按钮
            else if (target.classList.contains('remove-note-btn')) {
                if (confirm('确定要删除这条笔记吗？')) {
                    this.removeNote(noteId);
                    this.dispatchEvent(new CustomEvent('noteUpdated'));
                }
            }
        });
    }

    /**
     * 添加导出导入事件监听
     * @private
     * @param {HTMLElement} panel - 笔记面板元素
     */
    attachExportImportListeners(panel) {
        // 导出按钮
        const exportBtn = panel.querySelector('.export-notes-btn');
        this.addEventListenerWithCleanup(exportBtn, 'click', () => {
            try {
                const jsonData = this.exportNotes();
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `notes_${this.bookId}_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('导出笔记失败:', error);
                alert('导出笔记失败: ' + error.message);
            }
        });

        // 导入按钮和文件输入
        const importBtn = panel.querySelector('.import-notes-btn');
        const importInput = panel.querySelector('.import-notes-input');

        this.addEventListenerWithCleanup(importBtn, 'click', () => {
            importInput.click();
        });

        this.addEventListenerWithCleanup(importInput, 'change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    this.importNotes(e.target.result);
                    alert('笔记导入成功！');
                } catch (error) {
                    alert('导入笔记失败: ' + error.message);
                }
                // 清除文件输入，允许重复导入相同文件
                importInput.value = '';
            };
            reader.onerror = () => {
                alert('读取文件失败，请重试。');
                importInput.value = '';
            };
            reader.readAsText(file);
        });
    }

    /**
     * 清理资源
     */
    cleanup() {
        super.cleanup();
        this.saveNotes();
    }
} 