import { PDFReader } from './PDFReader.js';
import { EPUBReader } from './EPUBReader.js';

/**
 * 阅读器工厂类
 * 负责创建不同格式的阅读器实例
 */
export class ReaderFactory {
    /**
     * 创建阅读器实例
     * @param {string} format - 文件格式
     * @param {HTMLElement} container - 渲染容器
     * @returns {BaseReader} 阅读器实例
     */
    static createReader(format, container) {
        switch (format.toLowerCase()) {
            case 'pdf':
                return new PDFReader(container);
            case 'epub':
                return new EPUBReader(container);
            default:
                throw new Error(`不支持的文件格式: ${format}`);
        }
    }

    /**
     * 根据文件名或 MIME 类型判断文件格式
     * @param {string} filename - 文件名
     * @param {string} [contentType] - MIME 类型
     * @returns {string} 文件格式
     */
    static getFormat(filename, contentType) {
        // 首先尝试从文件扩展名判断
        const extension = filename.split('.').pop().toLowerCase();
        if (['pdf', 'epub'].includes(extension)) {
            return extension;
        }

        // 如果有 MIME 类型，从 MIME 类型判断
        if (contentType) {
            if (contentType.includes('application/pdf')) {
                return 'pdf';
            }
            if (contentType.includes('application/epub+zip')) {
                return 'epub';
            }
        }

        throw new Error('无法确定文件格式');
    }
} 