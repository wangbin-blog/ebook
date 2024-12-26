export class ReadingStats {
    constructor() {
        this.stats = this.loadStats();
    }

    loadStats() {
        return JSON.parse(localStorage.getItem('readingStats') || '{}');
    }

    saveStats() {
        localStorage.setItem('readingStats', JSON.stringify(this.stats));
    }

    // 开始阅读时调用
    startReading(bookId) {
        const now = new Date().getTime();
        if (!this.stats[bookId]) {
            this.stats[bookId] = {
                totalTime: 0,
                lastRead: now,
                startTime: now,
                progress: 0,
                completionDate: null,
                readCount: 0,
                currentPage: 1,
                totalPages: 0,
                history: []
            };
        } else {
            this.stats[bookId].startTime = now;
            this.stats[bookId].readCount++;
        }
        this.saveStats();
    }

    // 更新阅读进度
    updateProgress(bookId, progress, currentPage, totalPages) {
        if (!this.stats[bookId]) return;

        const now = new Date().getTime();
        const sessionTime = now - this.stats[bookId].startTime;

        this.stats[bookId].totalTime += sessionTime;
        this.stats[bookId].lastRead = now;
        this.stats[bookId].progress = progress;
        this.stats[bookId].currentPage = currentPage;
        this.stats[bookId].totalPages = totalPages;

        // 记录阅读历史
        this.stats[bookId].history.push({
            date: now,
            progress: progress,
            duration: sessionTime
        });

        // 如果完成阅读
        if (progress >= 100 && !this.stats[bookId].completionDate) {
            this.stats[bookId].completionDate = now;
        }

        this.saveStats();
    }

    // 获取阅读统计数据
    getBookStats(bookId) {
        return this.stats[bookId] || null;
    }

    // 获取所有已读书籍
    getAllReadBooks() {
        return Object.keys(this.stats).map(bookId => ({
            bookId,
            stats: this.stats[bookId]
        }));
    }

    // 获取阅读时长（分钟）
    getReadingTime(bookId) {
        if (!this.stats[bookId]) return 0;
        return Math.round(this.stats[bookId].totalTime / 60000); // 转换为分钟
    }

    // 获取最近阅读的书籍
    getRecentlyRead(limit = 5) {
        return Object.entries(this.stats)
            .sort(([, a], [, b]) => b.lastRead - a.lastRead)
            .slice(0, limit)
            .map(([bookId, stats]) => ({
                bookId,
                lastRead: stats.lastRead,
                progress: stats.progress
            }));
    }

    // 获取阅读趋势数据（最近30天）
    getReadingTrend() {
        const trend = new Array(30).fill(0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        Object.values(this.stats).forEach(bookStats => {
            bookStats.history.forEach(record => {
                const recordDate = new Date(record.date);
                recordDate.setHours(0, 0, 0, 0);
                const daysDiff = Math.floor((now - recordDate) / (1000 * 60 * 60 * 24));
                if (daysDiff < 30) {
                    trend[29 - daysDiff] += record.duration / (1000 * 60); // 转换为分钟
                }
            });
        });

        return trend;
    }

    // 获取总体统计
    getOverallStats() {
        const books = Object.values(this.stats);
        return {
            totalBooks: books.length,
            completedBooks: books.filter(b => b.completionDate).length,
            totalReadingTime: books.reduce((sum, b) => sum + b.totalTime, 0) / 60000, // 分钟
            averageProgress: books.reduce((sum, b) => sum + b.progress, 0) / books.length || 0
        };
    }
} 