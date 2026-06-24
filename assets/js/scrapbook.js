/**
 * Interactive 3D Scrapbook — page-flip; buku tetap di tengah (laptop & HP)
 */
(function () {
    function initScrapbook() {
        const modal = document.getElementById('scrapbook-modal');
        const openBtn = document.getElementById('scrapbook-open-btn');
        const closeBtn = document.getElementById('scrapbook-close');
        const prevBtn = document.getElementById('scrapbook-prev');
        const nextBtn = document.getElementById('scrapbook-next');
        const indicator = document.getElementById('scrapbook-page-num');
        const book = document.getElementById('scrapbook-book');
        const stage = document.querySelector('.scrapbook-stage');

        if (!modal || !book) return;

        const sheets = Array.from(book.querySelectorAll('.scrapbook-sheet'));
        const declaredTotal = parseInt(book.dataset.totalPages, 10);
        const TOTAL_PAGES = sheets.length;
        if (declaredTotal && declaredTotal !== TOTAL_PAGES) {
            console.warn(
                `Scrapbook: data-total-pages=${declaredTotal} but found ${TOTAL_PAGES} sheet(s). Update secret.html.`
            );
        }
        let currentIndex = 0;
        let isAnimating = false;

        const MOBILE_MAX_WIDTH = 767;

        function isMobileViewport() {
            return window.innerWidth <= MOBILE_MAX_WIDTH;
        }

        function updateBookShift() {
            if (!stage) return;
            /* Laptop & HP: buku tetap di tengah — tidak digeser saat membalik halaman */
            stage.style.setProperty('--book-shift', '0px');
            stage.dataset.pageIndex = String(currentIndex);
            const flipping = currentIndex > 0 && !isMobileViewport();
            stage.classList.toggle('is-flipping', flipping);
            stage.classList.toggle('is-mobile-stage', isMobileViewport());
        }

        function updateUI() {
            if (indicator) {
                indicator.textContent = `${currentIndex + 1} / ${TOTAL_PAGES}`;
            }
            if (prevBtn) prevBtn.disabled = currentIndex === 0 || isAnimating;
            if (nextBtn) nextBtn.disabled = currentIndex >= TOTAL_PAGES - 1 || isAnimating;
            updateBookShift();
        }

        function applySheetStates() {
            sheets.forEach((sheet, i) => {
                sheet.classList.remove('is-current', 'is-turned');
                let z = TOTAL_PAGES - i;
                if (i < currentIndex) {
                    sheet.classList.add('is-turned');
                    z = i + 1 + TOTAL_PAGES;
                } else if (i === currentIndex) {
                    sheet.classList.add('is-current');
                }
                sheet.style.zIndex = z;
            });
            updateUI();
        }

        function goToPage(index) {
            if (isAnimating || index < 0 || index >= TOTAL_PAGES || index === currentIndex) return;
            isAnimating = true;
            
            const animatingPageIndex = index > currentIndex ? currentIndex : index;
            if (sheets[animatingPageIndex]) {
                sheets[animatingPageIndex].style.zIndex = '100'; // Highest priority during animation
            }
            
            currentIndex = index;
            applySheetStates();
            
            setTimeout(() => {
                isAnimating = false;
                if (sheets[animatingPageIndex]) {
                    // Revert to computed z-index
                    sheets[animatingPageIndex].style.zIndex = animatingPageIndex < currentIndex ? 
                        (animatingPageIndex + 1 + TOTAL_PAGES) : (TOTAL_PAGES - animatingPageIndex);
                }
                updateUI();
            }, 850);
        }

        function nextPage() {
            if (currentIndex < TOTAL_PAGES - 1) goToPage(currentIndex + 1);
        }

        function prevPage() {
            if (currentIndex > 0) goToPage(currentIndex - 1);
        }

        function openModal() {
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('scrapbook-modal-open');
            currentIndex = 0;
            sheets.forEach((s) => s.classList.remove('is-turned', 'is-current'));
            if (sheets[0]) sheets[0].classList.add('is-current');
            applySheetStates();
        }

        function closeModal() {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('scrapbook-modal-open');
            currentIndex = 0;
            applySheetStates();
        }

        if (openBtn) openBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (prevBtn) prevBtn.addEventListener('click', prevPage);
        if (nextBtn) nextBtn.addEventListener('click', nextPage);

        modal.querySelector('.scrapbook-modal-backdrop')?.addEventListener('click', closeModal);

        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('is-open')) return;
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
        });

        let touchX = 0;
        let touchY = 0;
        book.addEventListener('touchstart', (e) => {
            touchX = e.changedTouches[0].screenX;
            touchY = e.changedTouches[0].screenY;
        }, { passive: true });

        book.addEventListener('touchend', (e) => {
            const diffX = e.changedTouches[0].screenX - touchX;
            const diffY = e.changedTouches[0].screenY - touchY;
            
            // Jika geseran lebih ke arah vertikal (scroll kebawah/keatas), abaikan agar tidak ganti halaman
            if (Math.abs(diffY) > Math.abs(diffX)) return;
            
            if (Math.abs(diffX) < 50) return;
            if (diffX < 0) nextPage();
            else prevPage();
        }, { passive: true });

        window.addEventListener('resize', () => {
            if (modal.classList.contains('is-open')) updateBookShift();
        });

        applySheetStates();
    }

    window.initScrapbook = initScrapbook;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrapbook);
    } else {
        initScrapbook();
    }
})();
