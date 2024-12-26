/**
 * 错误代码枚举
 */
export const ERROR_CODES = {
    LOAD_FAILED: 'LOAD_FAILED',
    RENDER_ERROR: 'RENDER_ERROR',
    INVALID_FORMAT: 'INVALID_FORMAT',
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * 错误处理工具类
 */
export class ErrorHandler {
    /**
     * 创建错误对象
     * @param {string} message - 错误消息
     * @param {string} code - 错误代码
     * @returns {Error} 错误对象
     */
    static createError(message, code = ERROR_CODES.UNKNOWN_ERROR) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    /**
     * 处理错误
     * @param {Error} error - 错误对象
     * @returns {string} 用户友好的错误消息
     */
    static handleError(error) {
        console.error('错误:', error);

        // 根据错误代码返回用户友好的消息
        switch (error.code) {
            case ERROR_CODES.LOAD_FAILED:
                return '加载文件失败，请检查文件是否损坏或格式是否正确。';
            case ERROR_CODES.RENDER_ERROR:
                return '渲染内容失败，请尝试刷新页面。';
            case ERROR_CODES.INVALID_FORMAT:
                return '不支持的文件格式。';
            case ERROR_CODES.NETWORK_ERROR:
                return '网络错误，请检查网络连接。';
            default:
                return error.message || '发生未知错误。';
        }
    }

    /**
     * 记录错误
     * @param {Error} error - 错误对象
     * @param {Object} context - 错误上下文
     */
    static logError(error, context = {}) {
        console.error('错误详情:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
            context
        });
    }
} 