/**
 * 错误处理工具类
 * 负责全局错误处理和错误监听
 */
export class ErrorHandler {
    static listeners = new Set();
    static initialized = false;

    /**
     * 初始化错误处理
     */
    static init() {
        if (this.initialized) return;

        // 处理未捕获的Promise错误
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
            event.preventDefault();
        });

        // 处理全局错误
        window.addEventListener('error', (event) => {
            this.handleError(event.error);
            event.preventDefault();
        });

        this.initialized = true;
    }

    /**
     * 添加错误监听器
     * @param {Function} listener - 错误监听函数
     */
    static addErrorListener(listener) {
        if (typeof listener === 'function') {
            this.listeners.add(listener);
        }
    }

    /**
     * 移除错误监听器
     * @param {Function} listener - 错误监听函数
     */
    static removeErrorListener(listener) {
        this.listeners.delete(listener);
    }

    /**
     * 处理错误
     * @param {Error} error - 错误对象
     */
    static handleError(error) {
        console.error('Global error:', error);

        // 通知所有监听器
        this.listeners.forEach(listener => {
            try {
                listener(error);
            } catch (listenerError) {
                console.error('Error in error listener:', listenerError);
            }
        });
    }

    /**
     * 创建自定义错误
     * @param {string} message - 错误信息
     * @param {string} code - 错误代码
     * @returns {Error} 自定义错误对象
     */
    static createError(message, code = 'UNKNOWN_ERROR') {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    /**
     * 包装异步函数以处理错误
     * @param {Function} fn - 要包装的异步函数
     * @returns {Function} 包装后的函数
     */
    static async wrapAsync(fn) {
        try {
            return await fn();
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * 清理所有监听器
     */
    static cleanup() {
        this.listeners.clear();
    }
} 