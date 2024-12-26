/**
 * 基础组件类
 * 提供组件通用功能
 */
export class BaseComponent {
    constructor() {
        this.eventListeners = new Map();
    }

    /**
     * 创建DOM元素
     * @param {string} tagName - 标签名
     * @param {string} className - 类名
     * @returns {HTMLElement} 创建的元素
     */
    createElement(tagName, className = '') {
        const element = document.createElement(tagName);
        if (className) {
            element.className = className;
        }
        return element;
    }

    /**
     * 创建错误元素
     * @param {string} message - 错误信息
     * @returns {HTMLElement} 错误元素
     */
    createErrorElement(message) {
        const element = this.createElement('div', 'error-message');
        element.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-text">${message}</div>
        `;
        return element;
    }

    /**
     * 创建加载元素
     * @param {string} message - 加载提示信息
     * @returns {HTMLElement} 加载元素
     */
    createLoadingElement(message) {
        const element = this.createElement('div', 'loading');
        element.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        return element;
    }

    /**
     * 添加事件监听器
     * @param {HTMLElement} element - 目标元素
     * @param {string} eventType - 事件类型
     * @param {Function} handler - 事件处理函数
     * @param {boolean|Object} options - 事件选项
     */
    addEventListenerWithCleanup(element, eventType, handler, options = false) {
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, new Map());
        }

        const elementListeners = this.eventListeners.get(element);
        if (!elementListeners.has(eventType)) {
            elementListeners.set(eventType, new Set());
        }

        elementListeners.get(eventType).add(handler);
        element.addEventListener(eventType, handler, options);
    }

    /**
     * 移除事件监听器
     * @param {HTMLElement} element - 目标元素
     * @param {string} eventType - 事件类型
     * @param {Function} handler - 事件处理函数
     * @param {boolean|Object} options - 事件选项
     */
    removeEventListenerWithCleanup(element, eventType, handler, options = false) {
        const elementListeners = this.eventListeners.get(element);
        if (!elementListeners) return;

        const typeListeners = elementListeners.get(eventType);
        if (!typeListeners) return;

        typeListeners.delete(handler);
        element.removeEventListener(eventType, handler, options);

        if (typeListeners.size === 0) {
            elementListeners.delete(eventType);
        }
        if (elementListeners.size === 0) {
            this.eventListeners.delete(element);
        }
    }

    /**
     * 防抖函数
     * @param {Function} fn - 要防抖的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * 节流函数
     * @param {Function} fn - 要节流的函数
     * @param {number} limit - 时间限制（毫秒）
     * @returns {Function} 节流后的函数
     */
    throttle(fn, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 清理组件
     */
    cleanup() {
        // 清理所有事件监听器
        this.eventListeners.forEach((elementListeners, element) => {
            elementListeners.forEach((handlers, eventType) => {
                handlers.forEach(handler => {
                    element.removeEventListener(eventType, handler);
                });
            });
        });
        this.eventListeners.clear();
    }
} 