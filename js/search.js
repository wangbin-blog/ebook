export class BookSearch {
    constructor(books) {
        this.books = books;
    }

    search(criteria) {
        return this.books.filter(book => {
            return this.matchesAllCriteria(book, criteria);
        });
    }

    matchesAllCriteria(book, criteria) {
        const {
            keyword,
            language,
            format,
            yearFrom,
            yearTo,
            sizeFrom,
            sizeTo,
            tags
        } = criteria;

        // 关键词匹配（标题、作者、简介）
        if (keyword && !this.matchesKeyword(book, keyword)) return false;

        // 语言匹配
        if (language && book.language !== language) return false;

        // 格式匹配
        if (format && !book.formats.includes(format)) return false;

        // 年份范围匹配
        if (yearFrom && book.year < yearFrom) return false;
        if (yearTo && book.year > yearTo) return false;

        // 文件大小范围匹配（转换为MB进行比较）
        const bookSizeMB = this.convertToMB(book.size);
        if (sizeFrom && bookSizeMB < sizeFrom) return false;
        if (sizeTo && bookSizeMB > sizeTo) return false;

        // 标签匹配
        if (tags && tags.length > 0) {
            if (!this.matchesTags(book, tags)) return false;
        }

        return true;
    }

    matchesKeyword(book, keyword) {
        const searchText = [
            book.title,
            book.author,
            book.description,
            book.publisher
        ].join(' ').toLowerCase();

        return keyword.toLowerCase().split(/\s+/).every(word =>
            searchText.includes(word)
        );
    }

    matchesTags(book, searchTags) {
        return searchTags.every(tag =>
            book.tags && book.tags.some(bookTag =>
                bookTag.toLowerCase() === tag.toLowerCase()
            )
        );
    }

    convertToMB(sizeString) {
        const size = parseFloat(sizeString);
        const unit = sizeString.replace(/[\d.]/g, '').toUpperCase();

        switch (unit) {
            case 'KB': return size / 1024;
            case 'MB': return size;
            case 'GB': return size * 1024;
            default: return size;
        }
    }
}

// 本地收藏功能
export class BookCollection {
    constructor() {
        this.collections = this.loadCollections();
    }

    loadCollections() {
        return JSON.parse(localStorage.getItem('bookCollections') || '{}');
    }

    saveCollections() {
        localStorage.setItem('bookCollections', JSON.stringify(this.collections));
    }

    addToCollection(collectionName, bookId) {
        if (!this.collections[collectionName]) {
            this.collections[collectionName] = [];
        }
        if (!this.collections[collectionName].includes(bookId)) {
            this.collections[collectionName].push(bookId);
            this.saveCollections();
        }
    }

    removeFromCollection(collectionName, bookId) {
        if (this.collections[collectionName]) {
            this.collections[collectionName] = this.collections[collectionName]
                .filter(id => id !== bookId);
            this.saveCollections();
        }
    }

    getCollection(collectionName) {
        return this.collections[collectionName] || [];
    }

    getAllCollections() {
        return Object.keys(this.collections);
    }

    createCollection(name) {
        if (!this.collections[name]) {
            this.collections[name] = [];
            this.saveCollections();
            return true;
        }
        return false;
    }

    deleteCollection(name) {
        if (this.collections[name]) {
            delete this.collections[name];
            this.saveCollections();
            return true;
        }
        return false;
    }
} 