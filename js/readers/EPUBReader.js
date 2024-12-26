import { BaseReader } from './BaseReader.js';
import { ERROR_CODES } from '../utils/ErrorHandler.js';

/**
 * EPUB 阅读器类
 * 负责处理 EPUB 格式的电子书
 * @extends BaseReader
 */
export class EPUBReader extends BaseReader {
    /**
     * 创建 EPUB 阅读器实例
     * @param {HTMLElement} container - 渲染容器
     */
    constructor(container) {
        super(container);
        this.book = null;
        this.rendition = null;
        this.currentLocation = 0;
        this.totalLocations = 0;
        this.scrollTimeout = null;

        // 设置容器样式
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.overflow = 'auto';
        this.container.style.backgroundColor = '#f0f0f0';
    }

    /**
     * 加载 EPUB 内容
     * @param {Blob} blob - EPUB 文件的 Blob 对象
     * @returns {Promise<void>}
     */
    async load(blob) {
        try {
            this.emit('loading', { message: '正在加载电子书...' });
            this.book = ePub(blob);
            await this.book.ready;

            // 使用连续滚动模式
            this.rendition = this.book.renderTo(this.container, {
                width: '100%',
                height: '100%',
                flow: 'scrolled-doc',
                manager: 'continuous',
                spread: 'none',
                minSpreadWidth: 800,
                allowScriptedContent: true,
                infinite: true
            });

            // 绑定事件处理器
            this._bindEvents();

            // 显示内容
            await this.rendition.display();

            // 生成位置信息
            await this.book.locations.generate(2048);
            this.totalLocations = this.book.locations.length();

            // 设置基本样式
            this._applyDefaultStyles();

            // 加载元数据和目录
            await this._loadMetadataAndToc();

            // 初始化事件监听和UI
            this.initializeEventListeners();
            this.initializeProgress();
            this.initializeTheme();

        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * 绑定事件处理器
     * @private
     */
    _bindEvents() {
        // 监听渲染器事件
        this.rendition.on('rendered', this._handleRendered.bind(this));
        this.rendition.on('relocated', this._handleRelocated.bind(this));

        // 启用连续滚动
        this.rendition.on('started', () => {
            const viewer = this.container.querySelector('.epub-container');
            if (viewer) {
                viewer.style.overflow = 'auto';
                viewer.style.height = '100%';
                viewer.style.width = '100%';
                viewer.style.position = 'relative';
                viewer.style.columnGap = '0px';
                viewer.style.touchAction = 'pan-y';
            }
        });

        // 处理滚动事件
        this.rendition.on('relocated', (location) => {
            if (this._isManualJump) return;

            if (location && location.start) {
                const currentLocation = this.book.locations.locationFromCfi(location.start.cfi);
                if (currentLocation !== undefined) {
                    this.currentLocation = currentLocation + 1;
                    this.updateUI(this.currentLocation);
                }
            }
        });
    }

    /**
     * 处理渲染完成事件
     * @private
     */
    _handleRendered(section) {
        try {
            const viewer = this.container.querySelector('.epub-container');
            if (!viewer) return;

            // 确保内容可以滚动
            viewer.style.overflow = 'auto';
            viewer.style.height = '100%';

            // 如果是手动跳转，不处理滚动位置
            if (this._isManualJump) return;

            // 更新位置
            if (section && section.href) {
                const location = this.rendition.currentLocation();
                if (location && location.start && location.start.cfi) {
                    const currentLocation = this.book.locations.locationFromCfi(location.start.cfi);
                    if (currentLocation !== undefined) {
                        this.currentLocation = currentLocation + 1;
                        this.updateUI(this.currentLocation);
                        this.emit('pageChanged', {
                            pageNumber: this.currentLocation,
                            totalPages: this.totalLocations
                        });
                    }
                }
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 跳转到上一页
     */
    prev() {
        if (this.rendition) {
            this._isManualJump = true;
            this.rendition.prev().then(() => {
                this._isManualJump = false;
            });
        }
    }

    /**
     * 跳转到下一页
     */
    next() {
        if (this.rendition) {
            this._isManualJump = true;
            this.rendition.next().then(() => {
                this._isManualJump = false;
            });
        }
    }

    /**
     * 应用默认样式
     * @private
     */
    _applyDefaultStyles() {
        const styles = {
            'body': {
                'padding': '20px 15%',
                'max-width': '100%',
                'margin': '0 auto',
                'font-family': 'system-ui, -apple-system, sans-serif',
                'line-height': '1.8',
                'background-color': 'var(--reader-background)',
                'color': 'var(--reader-text)',
                'text-align': 'justify',
                'overflow-y': 'auto',
                'height': '100%',
                '-webkit-overflow-scrolling': 'touch'
            },
            'p': {
                'margin-bottom': '1em',
                'text-indent': '2em',
                'color': 'var(--reader-text)'
            },
            'a': {
                'color': 'var(--reader-link)',
                'text-decoration': 'none'
            },
            'a:hover': {
                'color': 'var(--reader-link-hover)',
                'text-decoration': 'underline'
            },
            'h1, h2, h3, h4, h5, h6': {
                'color': 'var(--reader-heading)',
                'margin-bottom': '0.5em'
            },
            'img': {
                'max-width': '100%',
                'height': 'auto',
                'display': 'block',
                'margin': '1em auto',
                'filter': 'var(--reader-image-filter)'
            },
            '@media screen and (max-width: 800px)': {
                'body': {
                    'padding': '20px 5%'
                }
            }
        };

        this.rendition.themes.default(styles);
    }

    /**
     * 加载元数据和目录
     * @private
     */
    async _loadMetadataAndToc() {
        const [metadata, navigation] = await Promise.all([
            this.book.loaded.metadata,
            this.book.loaded.navigation
        ]);

        this.emit('loaded', {
            title: metadata.title || '未命名文档',
            totalPages: this.totalLocations,
            metadata: metadata
        });

        this.emit('tocLoaded', {
            toc: navigation.toc
        });
    }

    /**
     * 跳转到指定章节
     * @param {string} href - 章节链接
     */
    async goToChapter(href) {
        try {
            if (!this.rendition) return;

            this._isManualJump = true;

            // 获取章节的 spine item
            const spineItem = this.book.spine.get(href);
            if (!spineItem) {
                throw new Error('找不到目标章节');
            }

            // 先跳转到章节
            await this.rendition.display(href);

            // 等待渲染完成
            await new Promise(resolve => {
                const onRelocated = async (location) => {
                    this.rendition.off('relocated', onRelocated);

                    if (location && location.start) {
                        // 获取精确的 CFI
                        const cfi = location.start.cfi;
                        // 计算位置
                        const currentLocation = this.book.locations.locationFromCfi(cfi);
                        this.currentLocation = currentLocation + 1;
                        this.updateUI(this.currentLocation);

                        // 使用 CFI 进行精确定位
                        await this.rendition.display(cfi);

                        // 处理锚点
                        const viewer = this.container.querySelector('.epub-container');
                        if (viewer) {
                            const anchor = href.split('#')[1];
                            if (anchor) {
                                const iframe = viewer.querySelector('iframe');
                                if (iframe && iframe.contentDocument) {
                                    try {
                                        const element =
                                            iframe.contentDocument.getElementById(anchor) ||
                                            iframe.contentDocument.querySelector(`[id="${anchor}"]`) ||
                                            iframe.contentDocument.querySelector(`a[name="${anchor}"]`);

                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    } catch (e) {
                                        console.warn('处理锚点时出错:', e);
                                    }
                                }
                            }
                        }

                        this.emit('pageChanged', {
                            pageNumber: this.currentLocation,
                            totalPages: this.totalLocations
                        });
                    }
                    resolve();
                };

                this.rendition.on('relocated', onRelocated);
            });

            this._isManualJump = false;
        } catch (error) {
            this._isManualJump = false;
            this.handleError(error);
        }
    }

    /**
     * 处理位置变更事件
     * @private
     */
    _handleRelocated(location) {
        if (this._isManualJump) return;

        try {
            if (location.start) {
                let currentLocation;

                if (location.start.cfi) {
                    currentLocation = this.book.locations.locationFromCfi(location.start.cfi) + 1;
                } else if (location.start.percentage) {
                    currentLocation = Math.max(1, Math.min(
                        Math.round(location.start.percentage * this.totalLocations),
                        this.totalLocations
                    ));
                }

                if (currentLocation && currentLocation !== this.currentLocation) {
                    this.currentLocation = currentLocation;
                    this.updateUI(currentLocation);

                    this.emit('pageChanged', {
                        pageNumber: currentLocation,
                        totalPages: this.totalLocations
                    });
                }
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 跳转到指定位置
     * @param {number} location - 位置编号
     */
    goToLocation(location) {
        if (location >= 1 && location <= this.totalLocations) {
            // epub.js 内部位置从0开始，需要减1
            const cfi = this.book.locations.cfiFromLocation(location - 1);
            if (cfi) {
                this._isManualJump = true;
                this.currentLocation = location;
                this.updateUI(location);

                this.rendition.display(cfi).then(() => {
                    this._isManualJump = false;
                });
            }
        }
    }

    /**
     * 更新UI显示
     * @private
     * @param {number} location - 当前位置
     */
    updateUI(location) {
        // 确保位置在有效范围内
        const validLocation = Math.max(1, Math.min(location, this.totalLocations));

        // 更新进度条
        const progress = document.getElementById('progress');
        if (progress) {
            progress.value = String(validLocation);
        }

        // 更新页码显示
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `${validLocation}/${this.totalLocations}`;
        }
    }

    /**
     * 更新当前位置信息
     * @private
     */
    updateCurrentLocation() {
        try {
            const location = this.rendition.currentLocation();
            if (location && location.start && location.start.cfi) {
                const currentLocation = this.book.locations.locationFromCfi(location.start.cfi);
                if (currentLocation !== undefined) {
                    this.currentLocation = currentLocation + 1;
                    this.emit('pageChanged', {
                        pageNumber: this.currentLocation,
                        totalPages: this.totalLocations
                    });
                }
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 设置主题
     * @param {Object} theme - 主题样式
     */
    setTheme(theme) {
        if (!theme?.body || !this.rendition) return;

        const isDark = theme.body.background === '#222222';
        const styles = this._createThemeStyles(theme, isDark);

        // 使用 requestAnimationFrame 优化主题切换性能
        requestAnimationFrame(() => {
            // 更新渲染器主题
            this.rendition.themes.default(styles);
            this.rendition.themes.select('default');

            // 更新容器背景色
            this.container.style.backgroundColor = isDark ? '#1a1a1a' : '#f0f0f0';

            // 更新 iframe 背景色
            const iframe = this.container.querySelector('iframe');
            if (iframe) {
                iframe.style.backgroundColor = theme.body.background;
            }

            this.emit('themeChanged', { theme, isDark });
        });
    }

    /**
     * 创建主题样式
     * @private
     * @param {Object} theme - 主题配置
     * @param {boolean} isDark - 是否为暗黑模式
     * @returns {Object} 样式对象
     */
    _createThemeStyles(theme, isDark) {
        return {
            'body': {
                'color': `${theme.body.color} !important`,
                'background-color': `${theme.body.background} !important`,
                'padding': '20px 15%',
                'max-width': '100%',
                'margin': '0 auto',
                'font-family': 'system-ui, -apple-system, sans-serif',
                'line-height': '1.8'
            },
            'p, div, span': {
                'color': `${theme.body.color} !important`
            },
            'a': {
                'color': `${isDark ? '#6ea8fe' : '#0d6efd'} !important`,
                'text-decoration': 'none'
            },
            'a:hover': {
                'color': `${isDark ? '#9ec5fe' : '#0a58ca'} !important`,
                'text-decoration': 'underline'
            },
            'h1, h2, h3, h4, h5, h6': {
                'color': `${theme.body.color} !important`,
                'margin-bottom': '0.5em'
            },
            'img': {
                'max-width': '100%',
                'height': 'auto',
                'display': 'block',
                'margin': '1em auto',
                'filter': isDark ? 'brightness(0.8)' : 'none'
            },
            'pre, code': {
                'background-color': `${isDark ? '#333333' : '#f8f9fa'} !important`,
                'color': `${theme.body.color} !important`,
                'padding': '0.2em 0.4em',
                'border-radius': '3px'
            },
            'blockquote': {
                'border-left': `4px solid ${isDark ? '#6ea8fe' : '#0d6efd'} !important`,
                'padding-left': '1em',
                'margin-left': '0',
                'color': `${theme.body.color} !important`
            },
            'table': {
                'border-color': `${isDark ? '#444444' : '#dee2e6'} !important`
            },
            'th, td': {
                'border-color': `${isDark ? '#444444' : '#dee2e6'} !important`,
                'color': `${theme.body.color} !important`
            },
            '@media screen and (max-width: 800px)': {
                'body': {
                    'padding': '20px 5%'
                }
            }
        };
    }

    /**
     * 设置字体大小
     * @param {string} size - 字体大小（'small' | 'medium' | 'large'）
     */
    setFontSize(size) {
        const sizes = {
            small: { scale: 0.8, percent: '80%' },
            medium: { scale: 1.0, percent: '100%' },
            large: { scale: 1.2, percent: '120%' }
        };

        if (sizes[size] && this.rendition) {
            const { percent } = sizes[size];

            // 应用字体大小
            this.rendition.themes.fontSize(percent);

            // 触发字体大小变更事件
            this.emit('fontSizeChanged', { size, percent });
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        try {
            // 先移除事件监听器
            if (this._debouncedScroll) {
                this.container.removeEventListener('scroll', this._debouncedScroll);
            }
            document.removeEventListener('keydown', this.handleKeyDown);

            // 清理定时器
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }

            // 清理渲染器
            if (this.rendition) {
                // 移除所有事件监听
                this.rendition.removeAllListeners();

                // 安全地销毁渲染器
                try {
                    this.rendition.destroy();
                } catch (e) {
                    console.warn('销毁渲染器时出问题:', e);
                }
                this.rendition = null;
            }

            // 清理电子书对象
            if (this.book) {
                try {
                    this.book.destroy();
                } catch (e) {
                    console.warn('销毁电子书对象时出现问题:', e);
                }
                this.book = null;
            }

            // 安全地清理 DOM
            if (this.container) {
                // 使用更安全的方式清理DOM
                const range = document.createRange();
                range.selectNodeContents(this.container);
                range.deleteContents();

                // 重置容器样式
                this.container.style.overflow = '';
                this.container.style.height = '';
            }

            // 重置状态
            this.currentLocation = 0;
            this.totalLocations = 0;
            this._isManualJump = false;

            // 调用父类清理
            super.cleanup();
        } catch (error) {
            console.warn('清理资源时出现问题:', error);
        }
    }

    /**
     * 销毁实例
     */
    destroy() {
        try {
            this.cleanup();

            // 移除所有事件监听器
            this.removeAllListeners();

            // 清空引用
            this.container = null;
            this.book = null;
            this.rendition = null;
        } catch (error) {
            console.warn('销毁实例时出现问题:', error);
        }
    }

    /**
     * 初始化进度条
     * @private
     */
    initializeProgress() {
        const progress = document.getElementById('progress');
        if (progress) {
            progress.min = "1";
            progress.max = String(this.totalLocations);
            progress.value = "1";

            // 确保初始位置正确
            this.currentLocation = 1;
            document.getElementById('page-info').textContent = `1/${this.totalLocations}`;

            // 监听进度条变化
            progress.addEventListener('input', () => {
                const targetLocation = Math.max(1, Math.min(
                    parseInt(progress.value),
                    this.totalLocations
                ));

                // 更新当前位置
                this.currentLocation = targetLocation;
                document.getElementById('page-info').textContent = `${targetLocation}/${this.totalLocations}`;

                // 使用 locations API 进行跳转
                const cfi = this.book.locations.cfiFromLocation(targetLocation - 1);
                if (cfi) {
                    this._isManualJump = true;
                    this.rendition.display(cfi).then(() => {
                        this._isManualJump = false;
                    });
                }
            });
        }
    }

    /**
     * 初始化主题
     * @private
     */
    initializeTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            this.setTheme({
                body: {
                    color: '#ffffff',
                    background: '#222222'
                }
            });
        }
    }

    /**
     * 初始化事件监听
     * @private
     */
    initializeEventListeners() {
        super.initializeEventListeners();

        // 键盘事件监听
        this.handleKeyDown = (event) => {
            switch (event.key) {
                case 'ArrowLeft':
                case 'PageUp':
                    event.preventDefault();
                    this.prev();
                    break;
                case 'ArrowRight':
                case 'PageDown':
                case ' ':  // 空格键
                    event.preventDefault();
                    this.next();
                    break;
                case 'Home':
                    event.preventDefault();
                    this.goToLocation(0);
                    break;
                case 'End':
                    event.preventDefault();
                    if (this.book && this.book.locations && this.book.locations.length()) {
                        this.goToLocation(this.book.locations.length() - 1);
                    }
                    break;
            }
        };
        document.addEventListener('keydown', this.handleKeyDown);

        // 监听渲染器事件
        if (this.rendition) {
            // 监听渲染完成事件
            this.rendition.on('rendered', this._handleRendered.bind(this));
            // 监听位置变更事件
            this.rendition.on('relocated', this._handleRelocated.bind(this));
        }
    }

    handleScroll() {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }

        this.scrollTimeout = setTimeout(() => {
            const containerHeight = this.container.clientHeight;
            const scrollTop = this.container.scrollTop;
            const scrollHeight = this.container.scrollHeight;
            const maxScroll = scrollHeight - containerHeight;
            const isAtBottom = Math.ceil(scrollTop) >= maxScroll || Math.abs(maxScroll - scrollTop) < 1;
            let targetLocation;
            if (isAtBottom) {
                targetLocation = this.totalLocations;
            } else {
                const scrollPercentage = scrollTop / maxScroll;
                targetLocation = Math.max(1, Math.min(
                    Math.round(scrollPercentage * (this.totalLocations - 1)) + 1,
                    this.totalLocations
                ));
            }
            if (targetLocation !== this.currentLocation) {
                this.currentLocation = targetLocation;
                const progress = document.getElementById('progress');
                if (progress) {
                    progress.value = String(targetLocation);
                }
                document.getElementById('page-info').textContent = `${targetLocation}/${this.totalLocations}`;
                this.emit('pageChanged', {
                    pageNumber: targetLocation,
                    totalPages: this.totalLocations
                });
            }
        }, 100);
    }
} 