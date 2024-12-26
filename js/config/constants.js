/**
 * 阅读器常量配置
 */
export const READER_CONSTANTS = {
    SETTINGS: {
        FONT_SIZE: {
            MIN: 12,
            MAX: 32,
            DEFAULT: 16,
            STEP: 1
        },
        LINE_HEIGHT: {
            MIN: 1.2,
            MAX: 2.0,
            DEFAULT: 1.6,
            STEP: 0.1
        },
        MARGINS: {
            NARROW: '1rem',
            NORMAL: '2rem',
            WIDE: '4rem'
        }
    }
};

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
    SETTINGS: 'reader_settings',
    PROGRESS: 'reading_progress',
    BOOKMARKS: 'bookmarks',
    NOTES: 'notes',
    HISTORY: 'reading_history'
};

/**
 * 主题配置
 */
export const THEMES = {
    LIGHT: {
        name: 'light',
        label: '浅色',
        backgroundColor: '#ffffff',
        textColor: '#333333'
    },
    DARK: {
        name: 'dark',
        label: '深色',
        backgroundColor: '#1a1a1a',
        textColor: '#e0e0e0'
    },
    SEPIA: {
        name: 'sepia',
        label: '护眼',
        backgroundColor: '#f4ecd8',
        textColor: '#5b4636'
    }
};

/**
 * 字体配置
 */
export const FONT_FAMILIES = {
    SYSTEM: {
        value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        label: '系统默认'
    },
    SERIF: {
        value: 'Georgia, "Times New Roman", serif',
        label: '衬线字体'
    },
    SANS_SERIF: {
        value: '"Helvetica Neue", Arial, sans-serif',
        label: '无衬线字体'
    },
    MONO: {
        value: 'Consolas, Monaco, "Courier New", monospace',
        label: '等宽字体'
    }
};

/**
 * 文本对齐方式
 */
export const TEXT_ALIGN = {
    LEFT: {
        value: 'left',
        label: '左对齐'
    },
    JUSTIFY: {
        value: 'justify',
        label: '两端对齐'
    },
    CENTER: {
        value: 'center',
        label: '居中'
    }
};

/**
 * 边距配置
 */
export const MARGINS = {
    NARROW: {
        value: 'narrow',
        label: '窄'
    },
    NORMAL: {
        value: 'normal',
        label: '正常'
    },
    WIDE: {
        value: 'wide',
        label: '宽'
    }
};

/**
 * 错误代码
 */
export const ERROR_CODES = {
    LOAD_FAILED: 'LOAD_FAILED',
    INVALID_FORMAT: 'INVALID_FORMAT',
    NETWORK_ERROR: 'NETWORK_ERROR',
    STORAGE_ERROR: 'STORAGE_ERROR',
    RENDER_ERROR: 'RENDER_ERROR'
};

/**
 * 支持的文件格式
 */
export const SUPPORTED_FORMATS = {
    PDF: {
        extension: '.pdf',
        mimeType: 'application/pdf'
    },
    EPUB: {
        extension: '.epub',
        mimeType: 'application/epub+zip'
    },
    TXT: {
        extension: '.txt',
        mimeType: 'text/plain'
    }
}; 