/**
 * 防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * 错误处理函数
 * @param {Error} error - 错误对象
 * @param {HTMLElement} container - 显示错误的容器元素
 * @param {string} message - 自定义错误消息
 */
export function handleError(error, container, message = '发生错误') {
    console.error(error);
    if (container) {
        container.innerHTML = createErrorMessage(message, error.message);
    }
}

/**
 * 创建错误消息HTML
 * @param {string} title - 错误标题
 * @param {string} message - 错误详细信息
 * @returns {string} 错误消息HTML
 */
export function createErrorMessage(title, message) {
    return `
        <div class="alert alert-danger m-3">
            <h6 class="alert-heading">${title}</h6>
            <p class="mb-0">${message}</p>
        </div>
    `;
}

/**
 * HTML转义
 * @param {string} unsafe - 不安全的HTML字符串
 * @returns {string} 转义后的安全字符串
 */
export function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return '';
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * 格式化阅读时间
 * @param {number} milliseconds - 毫秒数
 * @returns {{hours: number, minutes: number}} 格式化后的时间对象
 */
export function formatReadingTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    return { hours, minutes };
}

/**
 * 验证数值是否在范围内
 * @param {number} value - 要验证的值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean} 是否在范围内
 */
export function isInRange(value, min, max) {
    return value >= min && value <= max;
}

/**
 * 安全的JSON解析
 * @param {string} str - 要解析的JSON字符串
 * @param {*} defaultValue - 解析失败时的默认值
 * @returns {*} 解析结果或默认值
 */
export function safeJSONParse(str, defaultValue = null) {
    try {
        return str ? JSON.parse(str) : defaultValue;
    } catch (error) {
        console.error('JSON parse error:', error);
        return defaultValue;
    }
}

/**
 * 创建带清理功能的事件监听器
 * @param {HTMLElement} element - DOM元素
 * @param {string} event - 事件名称
 * @param {Function} handler - 事件处理函数
 * @param {Object} options - 事件选项
 * @returns {Function} 清理函数
 */
export function createCleanableEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
}

/**
 * 节流函数
 * @param {Function} fn - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 获取元素的所有父元素
 * @param {HTMLElement} element - DOM元素
 * @returns {HTMLElement[]} 父元素数组
 */
export function getParents(element) {
    const parents = [];
    let currentElement = element;
    while (currentElement.parentElement) {
        parents.push(currentElement.parentElement);
        currentElement = currentElement.parentElement;
    }
    return parents;
}

/**
 * 格式化时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分钟`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}秒`);

    return parts.join(' ');
}

/**
 * 创建加载中元素
 * @param {string} message - 加载提示信息
 * @returns {string} 加载中HTML
 */
export function createLoadingMessage(message) {
    return `
        <div class="loading">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 检测用户是否处于活动状态
 */
export class UserActivityDetector {
    constructor(inactivityThreshold = 60000) {
        this.inactivityThreshold = inactivityThreshold;
        this.lastActivityTime = Date.now();
        this.isActive = true;
        this.activityListeners = new Set();

        this.activityEvents = ['mousedown', 'keydown', 'mousemove', 'wheel', 'touchstart'];
        this.boundHandleActivity = this.handleActivity.bind(this);

        this.init();
    }

    init() {
        this.activityEvents.forEach(eventType => {
            document.addEventListener(eventType, this.boundHandleActivity, { passive: true });
        });

        setInterval(() => this.checkActivity(), 1000);
    }

    handleActivity() {
        this.lastActivityTime = Date.now();
        if (!this.isActive) {
            this.isActive = true;
            this.notifyListeners();
        }
    }

    checkActivity() {
        const now = Date.now();
        const isNowActive = (now - this.lastActivityTime) < this.inactivityThreshold;

        if (this.isActive !== isNowActive) {
            this.isActive = isNowActive;
            this.notifyListeners();
        }
    }

    addActivityListener(listener) {
        if (typeof listener === 'function') {
            this.activityListeners.add(listener);
        }
    }

    removeActivityListener(listener) {
        this.activityListeners.delete(listener);
    }

    notifyListeners() {
        this.activityListeners.forEach(listener => {
            try {
                listener(this.isActive);
            } catch (error) {
                console.error('Error in activity listener:', error);
            }
        });
    }

    cleanup() {
        this.activityEvents.forEach(eventType => {
            document.removeEventListener(eventType, this.boundHandleActivity);
        });
        this.activityListeners.clear();
    }
} 