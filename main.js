function readBook(bookPath) {
    // 确保使用相对路径
    const cleanPath = bookPath.replace(/^\/+/, '');
    const readerUrl = `reader.html?book=${encodeURIComponent(cleanPath)}`;
    window.location.href = readerUrl;
} 