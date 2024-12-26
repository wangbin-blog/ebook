// 评分组件类
class RatingComponent {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            maxStars: options.maxStars || 5,
            initialRating: options.initialRating || 0,
            readOnly: options.readOnly || false,
            onChange: options.onChange || (() => { })
        };

        this.currentRating = this.options.initialRating;
        this.render();
        if (!this.options.readOnly) {
            this.setupEventListeners();
        }
    }

    render() {
        const stars = Array.from({ length: this.options.maxStars }, (_, index) => {
            const starClass = index < this.currentRating ? 'fas' : 'far';
            return `<i class="${starClass} fa-star" data-rating="${index + 1}"></i>`;
        }).join('');

        this.container.innerHTML = `
            <div class="rating-component">
                ${stars}
                <span class="rating-value">${this.currentRating.toFixed(1)}</span>
            </div>
        `;
    }

    setupEventListeners() {
        this.container.addEventListener('mouseover', (e) => {
            const star = e.target.closest('.fa-star');
            if (star) {
                const rating = parseInt(star.dataset.rating);
                this.highlightStars(rating);
            }
        });

        this.container.addEventListener('mouseout', () => {
            this.highlightStars(this.currentRating);
        });

        this.container.addEventListener('click', (e) => {
            const star = e.target.closest('.fa-star');
            if (star) {
                const newRating = parseInt(star.dataset.rating);
                this.setRating(newRating);
                this.options.onChange(newRating);
            }
        });
    }

    highlightStars(rating) {
        const stars = this.container.querySelectorAll('.fa-star');
        stars.forEach((star, index) => {
            star.className = index < rating ? 'fas fa-star' : 'far fa-star';
        });
    }

    setRating(rating) {
        this.currentRating = rating;
        this.highlightStars(rating);
        this.container.querySelector('.rating-value').textContent = rating.toFixed(1);
    }

    getRating() {
        return this.currentRating;
    }
}

export { RatingComponent }; 