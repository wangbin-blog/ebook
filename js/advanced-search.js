class AdvancedSearch {
    constructor() {
        this.form = document.getElementById('advanced-search-form');
        this.tagsContainer = document.getElementById('tags-container');
        this.searchResults = document.getElementById('search-results');
        this.resultCount = document.getElementById('result-count');
        this.searchHistory = document.getElementById('search-history');
        this.clearHistoryBtn = document.getElementById('clear-history');

        this.loadData();
        this.setupEventListeners();
    }

    async loadData() {
        try {
            const response = await fetch('data/books.json');
            const data = await response.json();

            // 加载分类
            const categorySelect = document.getElementById('category-select');
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = `${category.name} (${category.count})`;
                categorySelect.appendChild(option);
            });

            // 加载标签
            data.tags.forEach(tag => {
                const tagElement = document.createElement('div');
                tagElement.className = 'form-check form-check-inline';
                tagElement.innerHTML = `
                    <input class="form-check-input" type="checkbox" name="tags" value="${tag.name}" id="tag-${tag.name}">
                    <label class="form-check-label" for="tag-${tag.name}">
                        ${tag.name} (${tag.count})
                    </label>
                `;
                this.tagsContainer.appendChild(tagElement);
            });

            // 加载搜索历史
            this.loadSearchHistory();
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }

    setupEventListeners() {
        // 表单提交
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.search();
        });

        // 表单重置
        this.form.addEventListener('reset', () => {
            setTimeout(() => {
                this.searchResults.innerHTML = '';
                this.resultCount.textContent = '';
            }, 0);
        });

        // 清除搜索历史
        this.clearHistoryBtn.addEventListener('click', () => {
            Storage.searchHistory.clear();
            this.loadSearchHistory();
        });
    }

    async search() {
        try {
            const formData = new FormData(this.form);
            const searchParams = {
                title: formData.get('title'),
                author: formData.get('author'),
                isbn: formData.get('isbn'),
                publisher: formData.get('publisher'),
                category: formData.get('category'),
                language: formData.get('language'),
                yearFrom: formData.get('yearFrom'),
                yearTo: formData.get('yearTo'),
                format: formData.get('format'),
                tags: formData.getAll('tags')
            };

            // 保存搜索条件到历史记录
            if (searchParams.title || searchParams.author) {
                const searchText = [
                    searchParams.title && `标题:${searchParams.title}`,
                    searchParams.author && `作者:${searchParams.author}`
                ].filter(Boolean).join(', ');

                Storage.searchHistory.add(searchText);
                this.loadSearchHistory();
            }

            // 获取所有书籍数据
            const response = await fetch('data/books.json');
            const data = await response.json();

            // 过滤书籍
            const results = data.books.filter(book => {
                return (!searchParams.title || book.title.toLowerCase().includes(searchParams.title.toLowerCase())) &&
                    (!searchParams.author || book.author.toLowerCase().includes(searchParams.author.toLowerCase())) &&
                    (!searchParams.isbn || book.isbn.includes(searchParams.isbn)) &&
                    (!searchParams.publisher || book.publisher.toLowerCase().includes(searchParams.publisher.toLowerCase())) &&
                    (!searchParams.category || book.categories.includes(searchParams.category)) &&
                    (!searchParams.language || book.language === searchParams.language) &&
                    (!searchParams.yearFrom || parseInt(book.year) >= parseInt(searchParams.yearFrom)) &&
                    (!searchParams.yearTo || parseInt(book.year) <= parseInt(searchParams.yearTo)) &&
                    (!searchParams.format || book.format === searchParams.format) &&
                    (!searchParams.tags.length || searchParams.tags.every(tag => book.tags.includes(tag)));
            });

            // 显示结果
            this.displayResults(results);
        } catch (error) {
            console.error('搜索失败:', error);
        }
    }

    displayResults(results) {
        this.searchResults.innerHTML = '';
        this.resultCount.textContent = `(找到 ${results.length} 本书)`;

        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="col-12 text-center">未找到符合条件的书籍</div>';
            return;
        }

        results.forEach(book => {
            const bookElement = document.createElement('div');
            bookElement.className = 'col';
            bookElement.innerHTML = `
                <div class="card h-100">
                    <div class="row g-0">
                        <div class="col-4">
                            <img src="${book.cover}" class="img-fluid rounded-start" alt="${book.title}">
                        </div>
                        <div class="col-8">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <a href="#" class="text-decoration-none" data-book-id="${book.id}">${book.title}</a>
                                </h5>
                                <p class="card-text text-muted small">
                                    <i class="fas fa-user me-1"></i>${book.author}<br>
                                    <i class="fas fa-calendar me-1"></i>${book.year}<br>
                                    <i class="fas fa-file me-1"></i>${book.format}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.searchResults.appendChild(bookElement);
        });
    }

    loadSearchHistory() {
        const history = Storage.searchHistory.getAll();
        this.searchHistory.innerHTML = '';

        if (history.length === 0) {
            this.searchHistory.innerHTML = '<p class="text-muted mb-0">暂无搜索历史</p>';
            return;
        }

        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'search-history-item mb-2';
            historyItem.innerHTML = `
                <a href="#" class="text-decoration-none text-dark">
                    <i class="fas fa-history me-2 text-muted"></i>${item}
                </a>
            `;
            this.searchHistory.appendChild(historyItem);
        });
    }
}

// 初始化高级搜索
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedSearch();
}); 