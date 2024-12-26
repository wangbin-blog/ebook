class RecommendationSystem {
    constructor(books) {
        this.books = books;
    }

    // 基于阅读历史推荐
    getRecommendationsFromHistory(readHistory, limit = 4) {
        if (!readHistory || readHistory.length === 0) {
            return this.getPopularBooks(limit);
        }

        // 获取用户最近阅读的书籍
        const recentBooks = readHistory
            .map(id => this.books.find(book => book.id === id))
            .filter(book => book); // 过滤掉未找到的书籍

        if (recentBooks.length === 0) {
            return this.getPopularBooks(limit);
        }

        // 收集用户感兴趣的分类和标签
        const interests = this.collectUserInterests(recentBooks);

        // 为每本书计算推荐分数
        const recommendations = this.books
            .filter(book => !readHistory.includes(book.id)) // 排除已读书籍
            .map(book => ({
                book,
                score: this.calculateRecommendationScore(book, interests)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.book);

        return recommendations;
    }

    // 收集用户兴趣（分类和标签）
    collectUserInterests(recentBooks) {
        const interests = {
            categories: {},
            tags: {},
            authors: {}
        };

        recentBooks.forEach(book => {
            // 统计分类
            book.categories.forEach(category => {
                interests.categories[category] = (interests.categories[category] || 0) + 1;
            });

            // 统计标签
            book.tags.forEach(tag => {
                interests.tags[tag] = (interests.tags[tag] || 0) + 1;
            });

            // 统计作者
            interests.authors[book.author] = (interests.authors[book.author] || 0) + 1;
        });

        return interests;
    }

    // 计算推荐分数
    calculateRecommendationScore(book, interests) {
        let score = 0;

        // 分类匹配度
        book.categories.forEach(category => {
            if (interests.categories[category]) {
                score += interests.categories[category] * 2; // 分类权重较高
            }
        });

        // 标签匹配度
        book.tags.forEach(tag => {
            if (interests.tags[tag]) {
                score += interests.tags[tag];
            }
        });

        // 作者匹配度
        if (interests.authors[book.author]) {
            score += interests.authors[book.author] * 3; // 同作者权重最高
        }

        // 加入一些随机性，避免推荐过于单一
        score += Math.random() * 0.2;

        return score;
    }

    // 获取热门书籍（当没有阅读历史时使用）
    getPopularBooks(limit = 4) {
        return this.books
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, limit);
    }

    // 获取相似书籍
    getSimilarBooks(bookId, limit = 4) {
        const sourceBook = this.books.find(book => book.id === bookId);
        if (!sourceBook) {
            return this.getPopularBooks(limit);
        }

        // 为每本书计算与源书籍的相似度
        return this.books
            .filter(book => book.id !== bookId)
            .map(book => ({
                book,
                similarity: this.calculateSimilarity(sourceBook, book)
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(item => item.book);
    }

    // 计算两本书的相似度
    calculateSimilarity(book1, book2) {
        let similarity = 0;

        // 同作者
        if (book1.author === book2.author) {
            similarity += 3;
        }

        // 分类重叠
        const commonCategories = book1.categories.filter(c => book2.categories.includes(c));
        similarity += commonCategories.length * 2;

        // 标签重叠
        const commonTags = book1.tags.filter(t => book2.tags.includes(t));
        similarity += commonTags.length;

        // 出版时间接近（±2年）
        const yearDiff = Math.abs(parseInt(book1.year) - parseInt(book2.year));
        if (yearDiff <= 2) {
            similarity += (2 - yearDiff) * 0.5;
        }

        return similarity;
    }
}

// 在主页面加载推荐
function loadRecommendations(books) {
    const recommendationSystem = new RecommendationSystem(books);

    // 获取阅读历史
    const readHistory = Storage.readingHistory.getAll();

    // 获取推荐书籍
    const recommendations = recommendationSystem.getRecommendationsFromHistory(readHistory);

    // 显示推荐书籍
    const container = document.getElementById('recommended-books');
    if (container) {
        container.innerHTML = '';
        recommendations.forEach(book => {
            const bookCard = createCompactBookCard(book);
            container.appendChild(bookCard);
        });
    }

    // 显示最近阅读
    const recentContainer = document.getElementById('recent-books');
    if (recentContainer) {
        recentContainer.innerHTML = '';
        const recentBooks = readHistory
            .map(id => books.find(book => book.id === id))
            .filter(book => book)
            .slice(0, 4);

        recentBooks.forEach(book => {
            const bookCard = createCompactBookCard(book);
            recentContainer.appendChild(bookCard);
        });
    }
}

// 创建紧凑型书籍卡片
function createCompactBookCard(book) {
    const div = document.createElement('div');
    div.className = 'col';
    div.innerHTML = `
        <div class="card h-100 book-card">
            <a href="#" class="text-decoration-none" data-book-id="${book.id}">
                <img src="${book.cover}" class="card-img-top" alt="${book.title}" style="height: 200px; object-fit: cover;">
                <div class="card-body p-2">
                    <h6 class="card-title text-dark mb-1">${book.title}</h6>
                    <small class="text-muted">${book.author}</small>
                </div>
            </a>
        </div>
    `;
    return div;
}

// 导出推荐系统
export { RecommendationSystem, loadRecommendations }; 