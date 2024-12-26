// 图表配置
const chartConfig = {
    // 深色模式配置
    darkMode: {
        backgroundColor: 'rgba(45, 45, 45, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#e0e0e0'
    },
    // 浅色模式配置
    lightMode: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        textColor: '#333333'
    }
};

// 创建分类统计图表
function createCategoryChart(books) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    // 统计每个分类的书籍数量
    const categoryData = {};
    books.forEach(book => {
        book.categories.forEach(category => {
            categoryData[category] = (categoryData[category] || 0) + 1;
        });
    });

    // 排序并获取前5个分类
    const topCategories = Object.entries(categoryData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = isDarkMode ? chartConfig.darkMode : chartConfig.lightMode;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: topCategories.map(([category]) => category),
            datasets: [{
                data: topCategories.map(([, count]) => count),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: theme.textColor
                    }
                },
                title: {
                    display: true,
                    text: '热门分类',
                    color: theme.textColor
                }
            }
        }
    });
}

// 创建格式统计图表
function createFormatChart(books) {
    const ctx = document.getElementById('formatChart');
    if (!ctx) return;

    // 统计每种格式的书籍数量
    const formatData = {};
    books.forEach(book => {
        formatData[book.format] = (formatData[book.format] || 0) + 1;
    });

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = isDarkMode ? chartConfig.darkMode : chartConfig.lightMode;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(formatData),
            datasets: [{
                label: '书籍数量',
                data: Object.values(formatData),
                backgroundColor: '#36A2EB'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: '格式分布',
                    color: theme.textColor
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: theme.textColor
                    },
                    grid: {
                        color: theme.borderColor
                    }
                },
                x: {
                    ticks: {
                        color: theme.textColor
                    },
                    grid: {
                        color: theme.borderColor
                    }
                }
            }
        }
    });
}

// 创建月度统计图表
function createMonthlyChart(books) {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;

    // 获取最近12个月的数据
    const monthlyData = new Array(12).fill(0);
    const monthNames = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthNames.unshift(month.toLocaleDateString('zh-CN', { month: 'short' }));
    }

    books.forEach(book => {
        const addedDate = new Date(book.addedDate);
        const monthDiff = (now.getFullYear() - addedDate.getFullYear()) * 12 +
            now.getMonth() - addedDate.getMonth();

        if (monthDiff >= 0 && monthDiff < 12) {
            monthlyData[11 - monthDiff]++;
        }
    });

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = isDarkMode ? chartConfig.darkMode : chartConfig.lightMode;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthNames,
            datasets: [{
                label: '新增书籍',
                data: monthlyData,
                borderColor: '#4BC0C0',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: '月度统计',
                    color: theme.textColor
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: theme.textColor
                    },
                    grid: {
                        color: theme.borderColor
                    }
                },
                x: {
                    ticks: {
                        color: theme.textColor
                    },
                    grid: {
                        color: theme.borderColor
                    }
                }
            }
        }
    });
}

// 更新所有图表
function updateCharts(books) {
    createCategoryChart(books);
    createFormatChart(books);
    createMonthlyChart(books);
}

// 监听深色模式变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    updateCharts(window.library.books);
});

export { updateCharts }; 