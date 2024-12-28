// 主题类型定义
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 主题切换功能
function initTheme() {
    // 检查本地存储中的主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
        setTheme(savedTheme, false); // 初始化时不需要过渡效果
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme(THEMES.DARK, false);
    } else {
        setTheme(THEMES.LIGHT, false);
    }

    // 监听系统主题变化
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const debouncedThemeChange = debounce((e) => {
        const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
        setTheme(newTheme, true);
    }, 100);

    try {
        // Chrome & Firefox
        darkModeMediaQuery.addEventListener('change', debouncedThemeChange);
    } catch (e1) {
        try {
            // Safari
            darkModeMediaQuery.addListener(debouncedThemeChange);
        } catch (e2) {
            console.error('无法添加主题切换监听器:', e2);
        }
    }

    // 更新主题切换按钮图标
    requestAnimationFrame(() => updateThemeToggleIcon());
}

// 设置主题
function setTheme(theme, withTransition = true) {
    if (!Object.values(THEMES).includes(theme)) {
        console.error('无效的主题类型:', theme);
        return;
    }

    // 如果主题没有变化，直接返回
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === theme) return;

    // 使用 requestAnimationFrame 确保在下一帧执行 DOM 更新
    requestAnimationFrame(() => {
        // 如果不需要过渡效果，临时禁用
        if (!withTransition) {
            document.body.style.setProperty('transition', 'none');
        }

        // 设置新主题
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme); // 同时设置body的data-theme
        localStorage.setItem('theme', theme);

        // 如果之前禁用了过渡效果，重新启用
        if (!withTransition) {
            // 强制重排以应用样式
            void document.body.offsetHeight;
            document.body.style.removeProperty('transition');
        }

        // 更新UI
        updateThemeToggleIcon();

        // 触发自定义事件
        document.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme },
            bubbles: true,
            cancelable: true
        }));
    });
}

// 切换主题
const toggleTheme = debounce(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || THEMES.LIGHT;
    const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(newTheme, true);
}, 200);

// 更新主题切换按钮图标
function updateThemeToggleIcon() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const themeIcon = themeToggle.querySelector('i');
    if (!themeIcon) return;

    const currentTheme = document.documentElement.getAttribute('data-theme') || THEMES.LIGHT;

    // 图标映射
    const iconMap = {
        [THEMES.LIGHT]: 'moon',
        [THEMES.DARK]: 'sun'
    };

    // 标签映射
    const labelMap = {
        [THEMES.LIGHT]: '切换到深色主题',
        [THEMES.DARK]: '切换到浅色主题'
    };

    // 批量更新 DOM
    requestAnimationFrame(() => {
        themeIcon.className = `fas fa-${iconMap[currentTheme]}`;
        themeToggle.setAttribute('aria-label', labelMap[currentTheme]);
        themeToggle.title = labelMap[currentTheme];
    });
}

// 导出函数
export { initTheme, toggleTheme, THEMES }; 