import { BaseComponent } from './BaseComponent.js';
import {
    READER_CONSTANTS,
    STORAGE_KEYS,
    THEMES,
    FONT_FAMILIES,
    TEXT_ALIGN,
    MARGINS
} from '../config/constants.js';
import { safeJSONParse, isInRange } from '../utils/helpers.js';

/**
 * 阅读器设置管理类
 * 负责管理和应用阅读器的显示设置
 * @extends BaseComponent
 */
export class ReaderSettings extends BaseComponent {
    /**
     * 创建阅读器设置管理实例
     */
    constructor() {
        super();
        this.settings = this.loadSettings();
        this.initializeDefaults();
        this.applySettings();
    }

    /**
     * 初始化默认设置
     * @private
     */
    initializeDefaults() {
        const defaults = {
            fontSize: READER_CONSTANTS.SETTINGS.FONT_SIZE.DEFAULT,
            lineHeight: READER_CONSTANTS.SETTINGS.LINE_HEIGHT.DEFAULT,
            theme: THEMES.LIGHT.name,
            fontFamily: FONT_FAMILIES.SYSTEM.value,
            margin: MARGINS.NORMAL.value,
            textAlign: TEXT_ALIGN.LEFT.value
        };

        this.settings = { ...defaults, ...this.validateSettings(this.settings) };
        this.saveSettings();
    }

    /**
     * 验证设置对象
     * @param {Object} settings - 要验证的设置对象
     * @returns {Object} 验证后的设置对象
     * @private
     */
    validateSettings(settings) {
        const validatedSettings = {};

        // 字体大小验证
        if (this.validateSetting('fontSize', settings.fontSize)) {
            validatedSettings.fontSize = settings.fontSize;
        }

        // 行高验证
        if (this.validateSetting('lineHeight', settings.lineHeight)) {
            validatedSettings.lineHeight = settings.lineHeight;
        }

        // 主题验证
        if (this.validateSetting('theme', settings.theme)) {
            validatedSettings.theme = settings.theme;
        }

        // 字体验证
        if (this.validateSetting('fontFamily', settings.fontFamily)) {
            validatedSettings.fontFamily = settings.fontFamily;
        }

        // 边距验证
        if (this.validateSetting('margin', settings.margin)) {
            validatedSettings.margin = settings.margin;
        }

        // 对齐方式验证
        if (this.validateSetting('textAlign', settings.textAlign)) {
            validatedSettings.textAlign = settings.textAlign;
        }

        return validatedSettings;
    }

    /**
     * 验证单个设置值
     * @param {string} key - 设置键名
     * @param {*} value - 设置值
     * @returns {boolean} 是否有效
     * @private
     */
    validateSetting(key, value) {
        const validations = {
            fontSize: (v) => isInRange(v, READER_CONSTANTS.SETTINGS.FONT_SIZE.MIN, READER_CONSTANTS.SETTINGS.FONT_SIZE.MAX),
            lineHeight: (v) => isInRange(v, READER_CONSTANTS.SETTINGS.LINE_HEIGHT.MIN, READER_CONSTANTS.SETTINGS.LINE_HEIGHT.MAX),
            theme: (v) => Object.values(THEMES).some(theme => theme.name === v),
            fontFamily: (v) => Object.values(FONT_FAMILIES).some(font => font.value === v),
            margin: (v) => Object.values(MARGINS).some(margin => margin.value === v),
            textAlign: (v) => Object.values(TEXT_ALIGN).some(align => align.value === v)
        };

        const validator = validations[key];
        if (!validator) {
            console.warn(`Unknown setting: ${key}`);
            return false;
        }

        const isValid = validator(value);
        if (!isValid) {
            console.warn(`Invalid value for setting ${key}: ${value}`);
        }
        return isValid;
    }

    /**
     * 加载设置
     * @returns {Object} 设置对象
     * @private
     */
    loadSettings() {
        return safeJSONParse(localStorage.getItem(STORAGE_KEYS.SETTINGS), {});
    }

    /**
     * 保存设置
     * @private
     */
    saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * 更新设置
     * @param {string} key - 设置键名
     * @param {*} value - 设置值
     * @returns {boolean} 是否成功更新
     */
    updateSetting(key, value) {
        try {
            if (!this.validateSetting(key, value)) {
                return false;
            }

            this.settings[key] = value;
            this.saveSettings();
            this.applySettings();
            return true;
        } catch (error) {
            console.error('Failed to update setting:', error);
            return false;
        }
    }

    /**
     * 应用设置到阅读器
     * @private
     */
    applySettings() {
        try {
            const container = document.getElementById('reader-container');
            if (!container) {
                throw new Error('Reader container not found');
            }

            // 应用字体设置
            container.style.fontSize = `${this.settings.fontSize}px`;
            container.style.lineHeight = this.settings.lineHeight;
            container.style.fontFamily = this.settings.fontFamily;
            container.style.textAlign = this.settings.textAlign;

            // 应用边距
            container.style.padding = READER_CONSTANTS.SETTINGS.MARGINS[this.settings.margin.toUpperCase()];

            // 应用主题
            document.body.className = `theme-${this.settings.theme}`;

            // 触发自定义事件
            container.dispatchEvent(new CustomEvent('settingsChanged', {
                detail: this.settings
            }));
        } catch (error) {
            console.error('Failed to apply settings:', error);
        }
    }

    /**
     * 创建设置面板
     * @returns {HTMLElement} 设置面板元素
     */
    createSettingsPanel() {
        try {
            const panel = this.createElement('div', 'settings-panel');

            panel.innerHTML = `
                <div class="settings-group">
                    <h6>字体设置</h6>
                    <div class="setting-item">
                        <label>字体大小</label>
                        <input type="range" 
                               min="${READER_CONSTANTS.SETTINGS.FONT_SIZE.MIN}" 
                               max="${READER_CONSTANTS.SETTINGS.FONT_SIZE.MAX}" 
                               value="${this.settings.fontSize}" 
                               data-setting="fontSize">
                        <span class="setting-value">${this.settings.fontSize}px</span>
                    </div>
                    <div class="setting-item">
                        <label>行高</label>
                        <input type="range" 
                               min="${READER_CONSTANTS.SETTINGS.LINE_HEIGHT.MIN}" 
                               max="${READER_CONSTANTS.SETTINGS.LINE_HEIGHT.MAX}" 
                               step="${READER_CONSTANTS.SETTINGS.LINE_HEIGHT.STEP}" 
                               value="${this.settings.lineHeight}"
                               data-setting="lineHeight">
                        <span class="setting-value">${this.settings.lineHeight}</span>
                    </div>
                    <div class="setting-item">
                        <label>字体</label>
                        <select data-setting="fontFamily">
                            ${Object.values(FONT_FAMILIES).map(font => `
                                <option value="${font.value}" ${this.settings.fontFamily === font.value ? 'selected' : ''}>
                                    ${font.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div class="settings-group">
                    <h6>显示设置</h6>
                    <div class="setting-item">
                        <label>主题</label>
                        <select data-setting="theme">
                            ${Object.values(THEMES).map(theme => `
                                <option value="${theme.name}" ${this.settings.theme === theme.name ? 'selected' : ''}>
                                    ${theme.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>边距</label>
                        <select data-setting="margin">
                            ${Object.values(MARGINS).map(margin => `
                                <option value="${margin.value}" ${this.settings.margin === margin.value ? 'selected' : ''}>
                                    ${margin.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>对齐方式</label>
                        <select data-setting="textAlign">
                            ${Object.values(TEXT_ALIGN).map(align => `
                                <option value="${align.value}" ${this.settings.textAlign === align.value ? 'selected' : ''}>
                                    ${align.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            `;

            this.attachSettingListeners(panel);
            return panel;
        } catch (error) {
            console.error('Failed to create settings panel:', error);
            return this.createErrorElement('加载设置面板失败');
        }
    }

    /**
     * 添加设置事件监听器
     * @param {HTMLElement} panel - 设置面板元素
     * @private
     */
    attachSettingListeners(panel) {
        panel.querySelectorAll('[data-setting]').forEach(input => {
            const updateValue = (e) => {
                const setting = e.target.dataset.setting;
                const value = e.target.type === 'range' ? parseFloat(e.target.value) : e.target.value;

                if (this.updateSetting(setting, value)) {
                    // 更新显示的值
                    const valueDisplay = input.parentElement.querySelector('.setting-value');
                    if (valueDisplay) {
                        valueDisplay.textContent = e.target.type === 'range' ?
                            `${value}${setting === 'fontSize' ? 'px' : ''}` : '';
                    }
                }
            };

            // 对于范围输入，使用 input 事件实时更新
            if (input.type === 'range') {
                this.addEventListenerWithCleanup(input, 'input', this.debounce(updateValue, 100));
            } else {
                this.addEventListenerWithCleanup(input, 'change', updateValue);
            }
        });
    }
} 