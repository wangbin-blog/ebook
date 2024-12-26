// 本地存储管理
const Storage = {
    // 收藏夹相关
    favorites: {
        getAll() {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        },
        add(bookId) {
            const favorites = this.getAll();
            if (!favorites.includes(bookId)) {
                favorites.push(bookId);
                localStorage.setItem('favorites', JSON.stringify(favorites));
            }
        },
        remove(bookId) {
            const favorites = this.getAll();
            const index = favorites.indexOf(bookId);
            if (index > -1) {
                favorites.splice(index, 1);
                localStorage.setItem('favorites', JSON.stringify(favorites));
            }
        },
        isFavorite(bookId) {
            return this.getAll().includes(bookId);
        }
    },

    // 阅读进度相关
    readingProgress: {
        get(bookId) {
            const progress = JSON.parse(localStorage.getItem('readingProgress') || '{}');
            return progress[bookId] || { page: 1, percentage: 0, lastRead: null };
        },
        save(bookId, progress) {
            const allProgress = JSON.parse(localStorage.getItem('readingProgress') || '{}');
            allProgress[bookId] = {
                ...progress,
                lastRead: new Date().toISOString()
            };
            localStorage.setItem('readingProgress', JSON.stringify(allProgress));
        }
    },

    // 阅读历史
    readingHistory: {
        getAll() {
            return JSON.parse(localStorage.getItem('readingHistory') || '[]');
        },
        add(bookId) {
            const history = this.getAll();
            const index = history.indexOf(bookId);
            if (index > -1) {
                history.splice(index, 1);
            }
            history.unshift(bookId);
            // 只保留最近20本书的记录
            if (history.length > 20) {
                history.pop();
            }
            localStorage.setItem('readingHistory', JSON.stringify(history));
        }
    },

    // 搜索历史
    searchHistory: {
        getAll() {
            return JSON.parse(localStorage.getItem('searchHistory') || '[]');
        },
        add(keyword) {
            const history = this.getAll();
            const index = history.indexOf(keyword);
            if (index > -1) {
                history.splice(index, 1);
            }
            history.unshift(keyword);
            // 只��留最近10条搜索记录
            if (history.length > 10) {
                history.pop();
            }
            localStorage.setItem('searchHistory', JSON.stringify(history));
        },
        clear() {
            localStorage.removeItem('searchHistory');
        }
    },

    // 用户设置
    settings: {
        get() {
            return JSON.parse(localStorage.getItem('settings') || '{}');
        },
        save(settings) {
            localStorage.setItem('settings', JSON.stringify(settings));
        }
    }
}; 