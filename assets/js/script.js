// Synchronized Global Music Controller
function playMusic(songKey, btn) {
    if (!window.LoveeMusic) return;
    
    if (window.LoveeMusic.currentKey === songKey && window.LoveeMusic.isPlaying) {
        window.LoveeMusic.pause();
    } else {
        window.LoveeMusic.play(songKey);
    }
}

// Sync UI buttons with Global Music state
document.addEventListener('DOMContentLoaded', () => {
    if (window.LoveeMusic) {
        window.LoveeMusic.registerCallback((currentKey, isPlaying) => {
            const buttons = document.querySelectorAll('button[onclick*="playMusic"]');
            buttons.forEach(btn => {
                const onclickAttr = btn.getAttribute('onclick') || '';
                const match = onclickAttr.match(/playMusic\(['"]([^'"]+)['"]/);
                if (match) {
                    const songKey = match[1];
                    if (songKey === currentKey && isPlaying) {
                        btn.innerHTML = '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg><span>Pause Song</span>';
                    } else {
                        btn.innerHTML = '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span>Play Song</span>';
                    }
                }
            });
        });
    }
});

// Mood Letters Modal Handlers
function openMoodModal(mood) {
    const modal = document.getElementById('mood-modal-' + mood);
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('overflow-hidden');
    }
}

function closeMoodModal(mood) {
    const modal = document.getElementById('mood-modal-' + mood);
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('overflow-hidden');
    }
}

// Particle Explosion Function (single rAF loop — lighter on mobile)
function createExplosion(x, y) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const particles = [];
    for (let i = 0; i < 24; i++) {
        const particle = document.createElement('div');
        particle.className = 'fixed z-[101] pointer-events-none text-2xl';
        particle.textContent = '❤️';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        document.body.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 15 + 5;
        particles.push({
            el: particle,
            originX: x,
            originY: y,
            posX: x,
            posY: y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            opacity: 1
        });
    }

    const tick = () => {
        let alive = false;
        for (const p of particles) {
            if (p.opacity <= 0) continue;
            alive = true;
            p.posX += p.vx;
            p.posY += p.vy;
            p.opacity -= 0.02;
            p.el.style.transform = `translate(${p.posX - p.originX}px, ${p.posY - p.originY}px) scale(${p.opacity})`;
            p.el.style.opacity = String(p.opacity);
            if (p.opacity <= 0) p.el.remove();
        }
        if (alive) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function initStars(starsBg) {
    if (!starsBg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 70 : 100;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        const isTwinkle = Math.random() > 0.6;
        const colorRand = Math.random();
        
        let bgStyle = '';
        let shadowStyle = '';
        const size = Math.random() * 3.2 + 0.8;

        // Bintang gradasi Pink-Biru utama
        if (colorRand > 0.6) {
            bgStyle = 'radial-gradient(circle, #FF1493 0%, #00D2FF 100%)';
            shadowStyle = `0 0 ${size * 1.5}px rgba(255, 20, 147, 0.5), 0 0 ${size * 2.5}px rgba(0, 210, 255, 0.5)`;
        } 
        // Bintang variasi Pink Cerah
        else if (colorRand > 0.3) {
            bgStyle = '#FF1493';
            shadowStyle = `0 0 ${size * 2}px rgba(255, 20, 147, 0.7)`;
        } 
        // Bintang variasi Biru Cerah
        else {
            bgStyle = '#00D2FF';
            shadowStyle = `0 0 ${size * 2}px rgba(0, 210, 255, 0.7)`;
        }

        star.className = `absolute rounded-full star-dot${isTwinkle ? ' animate-twinkle' : ''}`;
        star.style.background = bgStyle;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.opacity = String(Math.random() * 0.8 + 0.2);
        star.style.animationDelay = Math.random() * 5 + 's';
        if (!isMobile) {
            star.style.boxShadow = shadowStyle;
        }
        fragment.appendChild(star);
    }

    starsBg.innerHTML = '';
    starsBg.appendChild(fragment);
}

function setupLazySections() {
    const sections = document.querySelectorAll('.lazy-section');
    if (!sections.length) return;

    if (!('IntersectionObserver' in window)) {
        sections.forEach((section) => section.classList.remove('animations-paused'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const section = entry.target;
            if (entry.isIntersecting) {
                section.classList.remove('animations-paused');
            } else {
                section.classList.add('animations-paused');
            }
        });
    }, { rootMargin: '120px 0px 200px 0px', threshold: 0 });

    sections.forEach((section) => {
        section.classList.add('animations-paused');
        observer.observe(section);
    });

    // One frame after layout: unpause sections already on screen (e.g. short viewport)
    requestAnimationFrame(() => {
        sections.forEach((section) => {
            const r = section.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;
            if (r.top < vh + 200 && r.bottom > -200) {
                section.classList.remove('animations-paused');
            }
        });
    });
}

// Typewriter Logic
function typeWriter(text, elementId, speed, callback) {
    let i = 0;
    const element = document.getElementById(elementId);
    if (!element) return;
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else if (callback) {
            callback();
        }
    }
    type();
}

function startAllTyping() {
    typeWriter("Demo Website Kenangan 🤍", "typewriter-h1", 100, () => {
        typeWriter("Template romantis untuk menyimpan momen spesial bersama.", "typewriter-h2", 80, () => {
            typeWriter("Halo! Ini adalah contoh teks sambutan yang bisa Anda ganti sesuai keinginan. Ceritakan alasan Anda membuat website ini, mungkin sebagai hadiah ulang tahun, anniversary, atau sekadar kejutan manis. Website ini dilengkapi dengan animasi menarik dan musik latar yang dapat disesuaikan background ini bisa di kasih foto ya sesuai request. Scroll ke bawah untuk melihat fitur-fitur lainnya.", "typewriter-p", 20, () => {
                const btn = document.getElementById('typewriter-btn');
                if (btn) {
                    btn.style.opacity = '1';
                    btn.style.transition = 'opacity 1s ease-in';
                }
            });
        });
    });
}

// ── Welcome Stars ───────────────────────────────────────────────
function initWelcomeStars() {
    const container = document.getElementById('welcome-stars');
    if (!container) return;
    const count = window.innerWidth < 768 ? 60 : 100;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        const size = Math.random() * 2.5 + 0.5;
        const colorRand = Math.random();
        s.style.cssText = `
            position:absolute;
            border-radius:50%;
            width:${size}px; height:${size}px;
            left:${Math.random()*100}%;
            top:${Math.random()*100}%;
            opacity:${Math.random()*0.7+0.2};
            animation: twinkle ${Math.random()*4+2}s ease-in-out infinite;
            animation-delay:${Math.random()*5}s;
            background: ${colorRand > 0.6 ? '#FF1493' : colorRand > 0.3 ? '#00D2FF' : '#ffffff'};
        `;
        frag.appendChild(s);
    }
    container.appendChild(frag);
}

// ── Handle Welcome Buttons ──────────────────────────────────────
function handleWelcomeYes() {
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const countdownOverlay = document.getElementById('countdown-overlay');

    // Tampilkan countdown di BELAKANG welcome dulu sebelum fade
    countdownOverlay.style.removeProperty('display');
    countdownOverlay.style.display = 'flex';

    // Baru fade out welcome
    welcomeOverlay.style.opacity = '0';
    setTimeout(() => {
        welcomeOverlay.style.display = 'none';
        startCountdown();
    }, 700);
}

function handleWelcomeNo() {
    const welcomeOverlay = document.getElementById('welcome-overlay');
    welcomeOverlay.style.opacity = '0';
    setTimeout(() => {
        // Try close tab, fallback to blank page
        window.close();
        setTimeout(() => { window.location.href = 'about:blank'; }, 300);
    }, 600);
}

// ── Countdown Logic ─────────────────────────────────────────────
function startCountdown() {
    const overlay = document.getElementById('countdown-overlay');
    const countText = document.getElementById('countdown-text');
    const starsBg = document.getElementById('stars-bg');

    sessionStorage.setItem('skipWelcome', '1');
    let count = 3;

    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countText.textContent = count;
        } else if (count === 0) {
            countText.textContent = "❤️";
            countText.classList.add('scale-[3]', 'transition-transform', 'duration-500');
        } else {
            clearInterval(timer);
            const rect = countText.getBoundingClientRect();
            createExplosion(rect.left + rect.width/2, rect.top + rect.height/2);
            countText.style.display = 'none';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                document.body.classList.add('start-animations');
                startAllTyping();
                if (starsBg) {
                    const runStars = () => initStars(starsBg);
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(runStars, { timeout: 1500 });
                    } else {
                        setTimeout(runStars, 50);
                    }
                }
            }, 1000);
        }
    }, 1000);
}

// ── Initialize Website Logic ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const starsBg = document.getElementById('stars-bg');
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const countdownOverlay = document.getElementById('countdown-overlay');

    // Init welcome stars
    initWelcomeStars();

    // If came back from another page (session already started), skip welcome
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('skip') === '1' || sessionStorage.getItem('skipWelcome') === '1') {
        // Hide welcome, hide countdown, go straight to content
        if (welcomeOverlay) welcomeOverlay.style.display = 'none';
        if (countdownOverlay) countdownOverlay.style.display = 'none';
        document.body.classList.add('start-animations');

        const h1 = document.getElementById('typewriter-h1');
        const h2 = document.getElementById('typewriter-h2');
        const p  = document.getElementById('typewriter-p');
        const btn = document.getElementById('typewriter-btn');

        if (h1) h1.innerHTML = "Demo Website Kenangan 🤍";
        if (h2) h2.innerHTML = "Template romantis untuk menyimpan momen spesial bersama.";
        if (p)  p.innerHTML  = "Halo! Ini adalah contoh teks sambutan yang bisa Anda ganti sesuai keinginan. Ceritakan alasan Anda membuat website ini, mungkin sebagai hadiah ulang tahun, anniversary, atau sekadar kejutan manis. Website ini dilengkapi dengan animasi menarik dan musik latar yang dapat disesuaikan. Scroll ke bawah untuk melihat fitur-fitur lainnya.";
        if (btn) btn.style.opacity = '1';

        if (starsBg) {
            const runStars = () => initStars(starsBg);
            if ('requestIdleCallback' in window) {
                requestIdleCallback(runStars, { timeout: 1500 });
            } else {
                setTimeout(runStars, 50);
            }
        }
    }
    // else: welcome screen is already visible, waiting for user to click a button

    setupLazySections();
});
