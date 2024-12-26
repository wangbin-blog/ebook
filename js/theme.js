// 主题切换功能
function initTheme() {
    // 检查本地存储中的主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // 如果用户系统设置为深色模式，自动切换到深色主题
        setTheme('dark');
    }

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
    });

    // 更新主题切换按钮图标
    updateThemeToggleIcon();
}

// 设置主题
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeToggleIcon();

    // 触发自定义事件
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

// 切换主题
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// 更新主题切换按钮图标
function updateThemeToggleIcon() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('i');
        const currentTheme = document.documentElement.getAttribute('data-theme');

        // 更新图标
        themeIcon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

        // 更新按钮的aria-label
        themeToggle.setAttribute('aria-label',
            currentTheme === 'dark' ? '切换到浅色主题' : '切换到深色主题'
        );
    }
}

// 导出函数
export { initTheme, toggleTheme }; 