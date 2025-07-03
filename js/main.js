import { initTheme, toggleTheme, THEMES } from './theme.js';

class Library {
    constructor() {
        this.books = [];
        this.categories = [];
        this.tags = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.isLoading = false;
        this.currentSearchQuery = '';

        // 将实例存储在window对象中，以便其他模块访问
        window.library = this;

        this.loadData();
        this.setupEventListeners();
        this.setupSortControls();
        this.setupInfiniteScroll();
        this.setupSearch();
    }

    async loadData() {
        try {
            // 添加错误处理和加载状态
            const loadingMore = document.getElementById('loading-more');
            if (loadingMore) {
                loadingMore.classList.remove('d-none');
            }

            // 添加时间戳防止缓存
            const response = await fetch('data/books.json?' + new Date().getTime(), {
                cache: 'no-store' // 禁用缓存
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // 验证数据结构
            if (!data || !Array.isArray(data.books)) {
                throw new Error('Invalid data structure');
            }

            this.books = data.books || [];
            this.categories = data.categories || [];
            this.tags = data.tags || [];

            // 确保文件格式小写
            this.books.forEach(book => {
                if (book.format) {
                    book.format = book.format.toLowerCase();
                }
            });

            // 初始化界面
            this.loadBooks();
            this.loadCategories();
            this.loadTags();

            if (loadingMore) {
                loadingMore.classList.add('d-none');
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            // 显示错误信息给用户
            const container = document.getElementById('books-container');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        加载数据失败，请刷新页面重试。
                        <br>
                        错误信息：${error.message}
                    </div>
                `;
            }
        }
    }

    loadBooks(filterCategory = null, filterTag = null, append = false) {
        const container = document.getElementById('books-container');
        const loadingMore = document.getElementById('loading-more');

        if (!container || !loadingMore) {
            console.error('Required DOM elements not found');
            return;
        }

        if (!append) {
            this.currentPage = 1;
            container.innerHTML = '';
        }

        // 获取最近阅读的书籍ID
        const recentlyRead = JSON.parse(localStorage.getItem('readingHistory') || '[]').slice(0, 3);

        // 过滤分类和标签
        let filteredBooks = this.books;

        if (filterCategory) {
            filteredBooks = filteredBooks.filter(book => book.categories.includes(filterCategory));
        }

        if (filterTag) {
            filteredBooks = filteredBooks.filter(book => book.tags.includes(filterTag));
        }

        // 将书籍分为最近阅读和其他书籍
        const recentBooks = [];
        const otherBooks = [];

        filteredBooks.forEach(book => {
            if (recentlyRead.includes(book.id)) {
                recentBooks.push(book);
            } else {
                otherBooks.push(book);
            }
        });

        // 对其他书籍进行排序
        const sortButton = document.querySelector('.dropdown-toggle');
        const sortText = sortButton ? sortButton.textContent.trim() : '按标题排序';

        switch (sortText) {
            case '按标题排序':
                otherBooks.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
                break;
            case '按作者排序':
                otherBooks.sort((a, b) => a.author.localeCompare(b.author, 'zh-CN'));
                break;
            case '按日期排序':
                otherBooks.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
                break;
        }

        // 合并最近阅读和其他书籍
        const allBooks = [...recentBooks, ...otherBooks];

        // 分页显示
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const booksToShow = allBooks.slice(start, end);

        booksToShow.forEach(book => {
            const bookElement = this.createBookCard(book);
            container.appendChild(bookElement);
        });

        this.isLoading = false;
        loadingMore.classList.add('d-none');

        // 检查是否还有更多书籍
        return end < allBooks.length;
    }

    loadCategories() {
        const container = document.getElementById('categories-list');
        container.innerHTML = '';

        // 添加"所有书籍"选项
        const allBooksItem = document.createElement('a');
        allBooksItem.href = '#';
        allBooksItem.className = 'nav-link active d-flex justify-content-between align-items-center';
        allBooksItem.innerHTML = `
            所有书籍
            <span class="badge bg-primary rounded-pill">${this.books.length}</span>
        `;
        allBooksItem.addEventListener('click', (e) => {
            e.preventDefault();
            this.setActiveCategory(null);
            this.loadBooks();
        });
        container.appendChild(allBooksItem);

        // 添加分类列表
        this.categories.forEach(category => {
            const categoryItem = document.createElement('a');
            categoryItem.href = '#';
            categoryItem.className = 'nav-link d-flex justify-content-between align-items-center';
            categoryItem.innerHTML = `
                ${category.name}
                <span class="badge bg-primary rounded-pill">${category.count}</span>
            `;
            categoryItem.addEventListener('click', (e) => {
                e.preventDefault();
                this.setActiveCategory(category.name);
                this.loadBooks(category.name);
            });
            container.appendChild(categoryItem);
        });
    }

    loadTags() {
        const container = document.getElementById('tag-cloud');
        container.innerHTML = '';

        // 计算标签权重
        const maxCount = Math.max(...this.tags.map(tag => tag.count));
        const minCount = Math.min(...this.tags.map(tag => tag.count));

        this.tags.forEach(tag => {
            // 计算标签大小类名
            const weight = (tag.count - minCount) / (maxCount - minCount);
            const sizeClass = weight < 0.2 ? 'tag-xs' :
                weight < 0.4 ? 'tag-sm' :
                    weight < 0.6 ? 'tag-md' :
                        weight < 0.8 ? 'tag-lg' : 'tag-xl';

            const tagElement = document.createElement('a');
            tagElement.href = '#';
            tagElement.className = `tag-item ${sizeClass}`;
            tagElement.textContent = tag.name;
            tagElement.addEventListener('click', (e) => {
                e.preventDefault();
                // 移除所有标签的激活状态
                document.querySelectorAll('.tag-item').forEach(el => {
                    el.classList.remove('active');
                });
                // 移除所有分类的激活状态
                document.querySelectorAll('.category-item').forEach(el => {
                    el.classList.remove('active');
                });
                // 添加当前标签的激活状态
                tagElement.classList.add('active');
                // 更新书籍列表
                this.loadBooks(null, tag.name);
            });
            container.appendChild(tagElement);
        });
    }

    updateStats() {
        // 更新统计信息
        document.getElementById('stats-total').textContent = this.books.length;
        document.getElementById('stats-tags').textContent = this.tags.length;
        document.getElementById('stats-categories').textContent = this.categories.length;

        // 获取最新更新时间
        const latestBook = this.books.reduce((latest, book) => {
            return new Date(book.addedDate) > new Date(latest.addedDate) ? book : latest;
        }, this.books[0]);

        document.getElementById('stats-updated').textContent =
            new Date(latestBook.addedDate).toLocaleDateString('zh-CN');
    }

    setActiveCategory(categoryName) {
        const links = document.querySelectorAll('#categories-list .nav-link');
        links.forEach(link => {
            link.classList.remove('active');
            if (categoryName === null && link.textContent.trim().startsWith('所有书籍') ||
                link.textContent.trim().startsWith(categoryName)) {
                link.classList.add('active');
            }
        });
    }

    createBookCard(book) {
        const div = document.createElement('div');
        div.className = 'col';

        // 使用默认封面图片
        const coverUrl = book.cover || 'https://via.placeholder.com/200x300?text=无封面';

        div.innerHTML = `
            <div class="card book-card">
                <div class="cover-container">
                    <img src="${coverUrl}" class="card-img-top" alt="${book.title}" loading="lazy"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/200x300?text=加载失败';">
                    <div class="cover-overlay">
                        <div class="tags">
                            ${book.tags.map(tag => `<span class="tag" data-tag="${tag}"><i class="fas fa-tag"></i> ${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <a href="#" class="text-decoration-none" data-book-id="${book.id}">
                        <h5 class="card-title">${book.title}</h5>
                        <p class="card-text">${book.description}</p>
                        <div class="book-info">
                            <small class="text-muted">分类：${book.categories.join(', ')}</small><br>
                            <small class="text-muted">格式：${book.format} · ${book.size}</small>
                        </div>
                    </a>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="window.library.readBook('${book.id}')">
                            <i class="fas fa-book-reader"></i> 阅读
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="window.library.downloadBook('${book.id}')">
                            <i class="fas fa-download"></i> 下载
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 为标签添加点击事件
        div.querySelectorAll('.tag').forEach(tagElement => {
            tagElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tag = tagElement.dataset.tag;
                // 移除所有标签的激活状态
                document.querySelectorAll('.tag-item').forEach(el => {
                    el.classList.remove('active');
                });
                // 移除所有分类的激活状态
                document.querySelectorAll('.category-item').forEach(el => {
                    el.classList.remove('active');
                });
                // 找到左侧对应的标签并激活
                const sidebarTag = Array.from(document.querySelectorAll('.tag-item')).find(el => el.textContent === tag);
                if (sidebarTag) {
                    sidebarTag.classList.add('active');
                }
                // 更新书籍列表
                this.loadBooks(null, tag);
            });
        });

        return div;
    }

    createBookListItem(book) {
        const div = document.createElement('div');
        div.className = 'col-12 mb-3';
        div.innerHTML = `
            <div class="card book-list-item">
                <div class="row g-0">
                    <div class="col-2 col-md-1">
                        <img src="${book.cover}" class="img-fluid rounded-start" alt="${book.title}" loading="lazy">
                    </div>
                    <div class="col-10 col-md-11">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="card-title mb-1">
                                    <a href="#" class="text-decoration-none" data-book-id="${book.id}">${book.title}</a>
                                </h5>
                                <div class="book-actions">
                                    <button class="btn btn-sm btn-outline-primary me-1" onclick="window.library.downloadBook('${book.id}')">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary" onclick="window.library.readBook('${book.id}')">
                                        <i class="fas fa-book-reader"></i>
                                    </button>
                                </div>
                            </div>
                            <p class="card-text text-truncate mb-1">${book.description}</p>
                            <div class="book-info">
                                <small class="text-muted me-3">作者：${book.author}</small>
                                <small class="text-muted me-3">分类：${book.categories.join(', ')}</small>
                                <small class="text-muted me-3">格式：${book.format} · ${book.size}</small>
                                <small class="text-muted">添加时间：${new Date(book.addedDate).toLocaleDateString('zh-CN')}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return div;
    }

    setupSortControls() {
        const sortButtons = document.querySelectorAll('.dropdown-item[data-sort]');
        const sortDisplay = document.querySelector('.dropdown-toggle');

        if (sortButtons && sortDisplay) {
            sortButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sortType = e.target.dataset.sort;
                    let sortText = '按标题排序';

                    switch (sortType) {
                        case 'title':
                            sortText = '按标题排序';
                            break;
                        case 'author':
                            sortText = '按作者排序';
                            break;
                        case 'date':
                            sortText = '按日期排序';
                            break;
                    }

                    sortDisplay.textContent = sortText;
                    this.loadBooks();
                });
            });
        }
    }

    setupEventListeners() {
        // 主题切换
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTheme();
            });
        }

        // 监听主题变化事件
        document.addEventListener('themechange', (e) => {
            const { theme } = e.detail;
            console.log('主题已切换为:', theme);
            // 在这里可以处理主题变化后的其他逻辑
        });

        // 侧边栏切换（移动端）
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        if (sidebarToggle && sidebar && overlay) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }

        // 书籍点击事件委托
        document.getElementById('books-container').addEventListener('click', (e) => {
            const bookLink = e.target.closest('a[data-book-id]');
            if (bookLink) {
                e.preventDefault();
                const bookId = bookLink.dataset.bookId;
                this.showBookDetails(bookId);
            }
        });

        // 导航栏自动收起功能
        let lastScrollTop = 0;
        const navbar = document.querySelector('.navbar-collapse');
        const navbarToggler = document.querySelector('.navbar-toggler');

        window.addEventListener('scroll', () => {
            if (navbar && navbar.classList.contains('show')) {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                if (Math.abs(scrollTop - lastScrollTop) > 10) {
                    navbar.classList.remove('show');
                    navbarToggler.setAttribute('aria-expanded', 'false');
                }
                lastScrollTop = scrollTop;
            }
        }, { passive: true });

        // 点击导航栏外部区域时收起导航栏
        document.addEventListener('click', (event) => {
            const isNavbar = event.target.closest('.navbar');
            const isNavbarToggler = event.target.closest('.navbar-toggler');
            if (!isNavbar && !isNavbarToggler && navbar && navbar.classList.contains('show')) {
                navbar.classList.remove('show');
                navbarToggler.setAttribute('aria-expanded', 'false');
            }
        });
    }

    showBookDetails(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;

        // 更新模态框内容
        document.getElementById('book-cover').src = book.cover;
        document.getElementById('book-title').textContent = book.title;
        document.getElementById('book-author').textContent = book.author;
        document.getElementById('book-publisher').textContent = book.publisher || '未知';
        document.getElementById('book-isbn').textContent = book.isbn || '未知';
        document.getElementById('book-language').textContent = book.language || '未知';
        document.getElementById('book-format').textContent = book.format;
        document.getElementById('book-size').textContent = book.size;
        document.getElementById('book-publishdate').textContent = new Date(book.publishDate).toLocaleDateString('zh-CN');
        document.getElementById('book-description').textContent = book.description;

        // 设置按钮的 data-book-id 属性
        const modalButtons = document.querySelectorAll('#bookDetailsModal .mt-3 button');
        modalButtons.forEach(button => {
            button.dataset.bookId = book.id;
        });

        // 添加页数显示
        const pagesSpan = document.getElementById('book-pages');
        if (book.pages) {
            pagesSpan.textContent = `（${book.pages}页）`;
            pagesSpan.style.display = 'inline';
        } else {
            pagesSpan.style.display = 'none';
        }

        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('bookDetailsModal'));
        modal.show();
    }

    // 添加下载和阅读功能
    downloadBook(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) {
            console.error('未找到指定的书籍');
            return;
        }

        if (!book.path) {
            console.error('书籍路径无效');
            return;
        }

        // 检查文件类型
        const allowedFormats = ['epub', 'pdf', 'mobi', 'txt'];
        const fileFormat = book.format.toLowerCase();
        if (!allowedFormats.includes(fileFormat)) {
            console.error('不支持的文件格式');
            return;
        }

        try {
            // 创建一个隐藏下载链接
            const link = document.createElement('a');
            link.href = book.path;
            link.download = book.path.split('/').pop(); // 使用原始文件名

            // 添加全属性
            link.rel = 'noopener noreferrer';
            link.target = '_blank';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('下载失败：', error);
            alert('下载失败，请检查文件路径是否正确');
        }
    }

    readBook(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) {
            console.error('未找到指定的书籍');
            return;
        }

        if (!book.path) {
            console.error('书籍路径无效');
            return;
        }

        // 检查文件类型
        const supportedFormats = ['epub', 'pdf'];
        const fileFormat = book.format.toLowerCase();
        if (!supportedFormats.includes(fileFormat)) {
            console.error('不支持的阅读格式');
            return;
        }

        try {
            // 从 book.path 中提取文件名
            const fileName = book.path.split('/').pop();
            // 构建相对路径
            const relativePath = `data/${fileName}`;

            // 在新标签页中打开阅读器
            const readerUrl = `reader.html?book=${encodeURIComponent(relativePath)}`;
            console.log('打开阅读器URL:', readerUrl, '文件名:', fileName);
            window.open(readerUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('打开阅读器失败：', error);
            alert('打开阅读器失败，请检查文件路径是否正确');
        }
    }

    setupInfiniteScroll() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading) {
                    this.loadMoreBooks();
                }
            });
        }, options);

        // 观察加载更多指示器
        const loadingMore = document.getElementById('loading-more');
        if (loadingMore) {
            observer.observe(loadingMore);
        }
    }

    loadMoreBooks() {
        if (this.isLoading) return;

        this.isLoading = true;
        const loadingMore = document.getElementById('loading-more');
        loadingMore.classList.remove('d-none');

        // 短暂延迟以显示加载动画
        setTimeout(() => {
            this.currentPage++;
            const hasMore = this.loadBooks(null, null, true);

            // 如果更多书籍，隐藏加载指示器
            if (!hasMore) {
                loadingMore.classList.add('d-none');
            }
        }, 500);
    }
    setupSearch() {
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-input');
        const debounce = (fn, time) => {
            let timeout;
          
            return function() {
              const functionCall = () => fn.apply(this, arguments);
          
              clearTimeout(timeout);
              timeout = setTimeout(functionCall, time);
            }
          }
        if (searchForm && searchInput) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = searchInput.value.trim();
                this.currentSearchQuery = query;
                this.searchBooks(query);
            });

            // 添加实时搜索功能（可选）
            searchInput.addEventListener('input', debounce((e) => {
                const query = e.target.value.trim();
                this.currentSearchQuery = query;
                this.searchBooks(query);
            }, 300));
        }
    }

    searchBooks(query) {
        if (!query) {
            this.loadBooks();
            return;
        }

        const container = document.getElementById('books-container');
        container.innerHTML = '';

        const searchResults = this.books.filter(book => {
            const searchText = [
                book.title,
                book.author,
                book.description,
                book.publisher,
                book.categories.join(' '),
                book.tags.join(' ')
            ].join(' ').toLowerCase();

            return query.toLowerCase().split(/\s+/).every(word => searchText.includes(word));
        });

        if (searchResults.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center mt-4">
                    <div class="alert alert-info" role="alert">
                        未找到符合"${query}"的搜索结果
                    </div>
                </div>
            `;
            return;
        }

        searchResults.forEach(book => {
            const bookElement = this.createBookCard(book);
            container.appendChild(bookElement);
        });
    }
}

// 初始化图书馆
document.addEventListener('DOMContentLoaded', () => {
    new Library();

    // 初始化主题
    initTheme();
}); 