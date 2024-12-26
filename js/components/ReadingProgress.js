import { BaseComponent } from './BaseComponent.js';
import { STORAGE_KEYS } from '../config/constants.js';
import { safeJSONParse, formatTime } from '../utils/helpers.js';
import { UserActivityDetector } from '../utils/helpers.js';

/**
 * 阅读进度管理类
 * 负责管理和保存阅读进度、阅读时间等信息
 * @extends BaseComponent
 */
export class ReadingProgress extends BaseComponent {
    /**
     * 创建阅读进度管理实例
     * @param {string} bookId - 图书ID
     */
    constructor(bookId) {
        super();
        this.bookId = bookId;
        this.startTime = Date.now();
        this.totalTime = 0;
        this.currentPage = 1;
        this.totalPages = 1;
        this.lastSaveTime = Date.now();
        this.isReading = false;

        // 初始化用户活动检测
        this.activityDetector = new UserActivityDetector(60000); // 1分钟无操作视为不活跃
        this.activityDetector.addActivityListener(this.handleActivityChange.bind(this));

        // 加载保存的进度
        this.loadProgress();

        // 定期保存进度
        this.startAutoSave();
    }

    /**
     * 加载保存的进度
     * @private
     */
    loadProgress() {
        const key = `${STORAGE_KEYS.PROGRESS}_${this.bookId}`;
        const savedProgress = safeJSONParse(localStorage.getItem(key), null);

        if (savedProgress) {
            this.totalTime = savedProgress.totalTime || 0;
            this.currentPage = savedProgress.currentPage || 1;
            this.totalPages = savedProgress.totalPages || 1;
            this.lastSaveTime = savedProgress.lastSaveTime || Date.now();
        }
    }

    /**
     * 保存进度
     * @private
     */
    saveProgress() {
        try {
            const key = `${STORAGE_KEYS.PROGRESS}_${this.bookId}`;
            const progress = {
                totalTime: this.totalTime,
                currentPage: this.currentPage,
                totalPages: this.totalPages,
                lastSaveTime: Date.now(),
                lastPosition: this.currentPage / this.totalPages
            };

            localStorage.setItem(key, JSON.stringify(progress));
            this.lastSaveTime = Date.now();

            // 保存到阅读历史
            this.updateReadingHistory();
        } catch (error) {
            console.error('Failed to save reading progress:', error);
        }
    }

    /**
     * 更新阅读历史
     * @private
     */
    updateReadingHistory() {
        try {
            const history = safeJSONParse(localStorage.getItem(STORAGE_KEYS.HISTORY), []);
            const existingIndex = history.findIndex(item => item.bookId === this.bookId);

            const historyItem = {
                bookId: this.bookId,
                lastRead: Date.now(),
                progress: this.currentPage / this.totalPages,
                totalTime: this.totalTime,
                currentPage: this.currentPage,
                totalPages: this.totalPages
            };

            if (existingIndex >= 0) {
                history[existingIndex] = historyItem;
            } else {
                history.unshift(historyItem);
            }

            // 只保留最近的100条记录
            if (history.length > 100) {
                history.pop();
            }

            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
        } catch (error) {
            console.error('Failed to update reading history:', error);
        }
    }

    /**
     * 开始自动保存
     * @private
     */
    startAutoSave() {
        // 每30秒保存一次进度
        this.autoSaveInterval = setInterval(() => {
            if (this.isReading) {
                this.updateReadingTime();
                this.saveProgress();
            }
        }, 30000);
    }

    /**
     * 处理用户活动状态变化
     * @private
     * @param {boolean} isActive - 是否活跃
     */
    handleActivityChange(isActive) {
        this.isReading = isActive;
        if (!isActive) {
            this.updateReadingTime();
            this.saveProgress();
        }
    }

    /**
     * 更新阅读时间
     * @private
     */
    updateReadingTime() {
        if (this.isReading) {
            const now = Date.now();
            const timeSinceLastSave = now - this.lastSaveTime;
            this.totalTime += timeSinceLastSave;
            this.lastSaveTime = now;
        }
    }

    /**
     * 更新进度
     * @param {number} currentPage - 当前页码
     * @param {number} totalPages - 总页数
     */
    updateProgress(currentPage, totalPages) {
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.saveProgress();
    }

    /**
     * 获取阅读时间
     * @returns {string} 格式化的阅读时间
     */
    getReadingTime() {
        return formatTime(Math.floor(this.totalTime / 1000));
    }

    /**
     * 获取阅读进度
     * @returns {number} 阅读进度（0-100）
     */
    getProgress() {
        return Math.round((this.currentPage / this.totalPages) * 100);
    }

    /**
     * 获取上次阅读位置
     * @returns {number} 上次阅读的页码
     */
    getLastPosition() {
        return this.currentPage;
    }

    /**
     * 创建进度面板
     * @returns {HTMLElement} 进度面板元素
     */
    createProgressPanel() {
        const panel = this.createElement('div', 'progress-panel');

        panel.innerHTML = `
            <div class="progress-info">
                <div class="progress-item">
                    <label>阅读时间</label>
                    <span class="reading-time">${this.getReadingTime()}</span>
                </div>
                <div class="progress-item">
                    <label>阅读进度</label>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${this.getProgress()}%"></div>
                    </div>
                    <span class="progress-text">${this.getProgress()}%</span>
                </div>
                <div class="progress-item">
                    <label>当前页码</label>
                    <span class="page-info">${this.currentPage} / ${this.totalPages}</span>
                </div>
            </div>
        `;

        return panel;
    }

    /**
     * 清理资源
     */
    cleanup() {
        super.cleanup();
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.updateReadingTime();
        this.saveProgress();
        this.activityDetector.cleanup();
    }
} 