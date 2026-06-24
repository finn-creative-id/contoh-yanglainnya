// Global Music Player & Cross-Page State Synchronizer
// Handles persistent playback using localStorage

(function() {
    const SONGS = {
        'sempurna': 'assets/music/sempurna.mp3',
        'somebodys-pleasure': 'assets/music/somebodys-pleasure.mp3',
        'terpukau': 'assets/music/terpukau.mp3'
    };

    const SONG_INFO = {
        'sempurna': { title: 'Sempurna', artist: 'Andra and the BackBone' },
        'somebodys-pleasure': { title: "Somebody's Pleasure", artist: 'Aziz Hedra' },
        'terpukau': { title: 'Terpukau', artist: 'Astrid' }
    };

    const SONG_KEYS = ['sempurna', 'somebodys-pleasure', 'terpukau'];

    class GlobalMusicPlayer {
        constructor() {
            this.audio = new Audio();
            this.currentKey = localStorage.getItem('music_songKey') || 'sempurna';
            this.isPlaying = localStorage.getItem('music_isPlaying') === 'true';
            this.restoredTime = parseFloat(localStorage.getItem('music_currentTime') || '0');
            
            this.audio.src = SONGS[this.currentKey];
            this.audio.loop = false;
            
            // Set initial position
            if (this.restoredTime > 0) {
                this.audio.currentTime = this.restoredTime;
            }

            // Sync state to localstorage frequently
            this.audio.addEventListener('timeupdate', () => {
                localStorage.setItem('music_currentTime', this.audio.currentTime.toString());
            });

            this.audio.addEventListener('ended', () => {
                this.nextTrack();
            });

            this.widget = null;
            this.onStateChangeCallbacks = [];

            // Initialize widget on DOM load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                this.init();
            }
        }

        init() {
            this.injectWidget();
            this.bindEvents();
            this.updateWidgetUI();

            // Try to auto-resume playback if it was playing on the previous page
            if (this.isPlaying) {
                // Play requires user gesture, but if they navigated here, they just clicked a link,
                // so the browser will let us autoplay. If it fails, we catch it silently.
                this.audio.play().then(() => {
                    this.isPlaying = true;
                    localStorage.setItem('music_isPlaying', 'true');
                    this.updateWidgetUI();
                    this.triggerStateChange();
                }).catch(err => {
                    console.log("Autoplay blocked by browser. Click the player to resume.", err);
                    this.isPlaying = false;
                    localStorage.setItem('music_isPlaying', 'false');
                    this.updateWidgetUI();
                    this.triggerStateChange();
                });
            }
        }

        injectWidget() {
            if (document.getElementById('floating-music-widget')) return;

            const container = document.createElement('div');
            container.id = 'floating-music-widget';
            container.className = 'fixed bottom-6 right-6 z-[120] flex items-center gap-3 transition-opacity duration-500 opacity-80 hover:opacity-100';
            
            container.innerHTML = `
                <!-- Sliding info panel -->
                <div id="music-info-panel" class="bg-white/90 backdrop-blur-md border border-white/60 shadow-lg rounded-2xl py-2 px-4 flex items-center gap-3 max-w-[220px] transition-all duration-500 translate-x-10 opacity-0 pointer-events-none">
                    <div class="flex-1 min-w-0">
                        <p id="floating-song-title" class="text-[11px] font-black text-[#0B2F61] truncate">Sempurna</p>
                        <p id="floating-song-artist" class="text-[9px] text-[#0B2F61]/60 font-semibold truncate">Andra and the BackBone</p>
                    </div>
                    <button id="floating-next-btn" type="button" class="w-6 h-6 rounded-full bg-[#D4EBF8] hover:bg-[#BAE6FD] flex items-center justify-center text-xs transition-colors shadow-sm focus:outline-none" title="Next Song">
                        ⏭️
                    </button>
                </div>
                <!-- Vinyl Disk Container -->
                <div class="relative group cursor-pointer" id="floating-vinyl-clicker">
                    <!-- Vinyl shadow glow -->
                    <div class="absolute -inset-1 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                    <!-- The Vinyl Disk -->
                    <div id="floating-vinyl-disk" class="relative w-14 h-14 bg-neutral-950 border-[3.5px] border-neutral-900 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-500 hover:scale-105 active:scale-95">
                        <!-- Vinyl Groove lines -->
                        <div class="absolute inset-1 rounded-full border border-neutral-800/40 opacity-80"></div>
                        <div class="absolute inset-2 rounded-full border border-neutral-800/60 opacity-60"></div>
                        <div class="absolute inset-3 rounded-full border border-neutral-800/80 opacity-40"></div>
                        <!-- Center Label -->
                        <div class="w-4.5 h-4.5 bg-[#FF1493] rounded-full border-2 border-white/90 flex items-center justify-center relative shadow-inner">
                            <div class="w-1 h-1 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <!-- Stylus / Tonearm -->
                    <div id="floating-stylus" class="absolute -top-1 -right-0.5 w-7 h-9 origin-[top_right] transition-transform duration-500 rotate-[-28deg] pointer-events-none">
                        <!-- Tonearm SVG -->
                        <svg class="w-full h-full text-slate-300 drop-shadow-md" viewBox="0 0 30 40" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round">
                            <circle cx="25" cy="5" r="2.5" fill="#94a3b8" />
                            <path d="M 25 5 L 13 24 L 9 27 L 9 32" />
                            <rect x="6" y="30" width="5" height="3" rx="0.5" fill="#64748b" />
                        </svg>
                    </div>
                </div>
            `;

            document.body.appendChild(container);
            this.widget = container;
        }

        bindEvents() {
            const clicker = document.getElementById('floating-vinyl-clicker');
            const nextBtn = document.getElementById('floating-next-btn');

            if (clicker) {
                clicker.addEventListener('click', () => this.togglePlay());
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.nextTrack();
                });
            }
        }

        togglePlay() {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play(this.currentKey);
            }
        }

        play(key) {
            let isNew = false;
            if (key !== this.currentKey) {
                this.currentKey = key;
                this.audio.src = SONGS[key];
                this.audio.load();
                isNew = true;
            }

            this.isPlaying = true;
            localStorage.setItem('music_songKey', this.currentKey);
            localStorage.setItem('music_isPlaying', 'true');

            this.audio.play().then(() => {
                this.updateWidgetUI();
                this.triggerStateChange();
            }).catch(err => {
                console.error("Playback failed:", err);
                this.isPlaying = false;
                localStorage.setItem('music_isPlaying', 'false');
                this.updateWidgetUI();
                this.triggerStateChange();
            });
        }

        pause() {
            this.isPlaying = false;
            localStorage.setItem('music_isPlaying', 'false');
            this.audio.pause();
            this.updateWidgetUI();
            this.triggerStateChange();
        }

        nextTrack() {
            const curIdx = SONG_KEYS.indexOf(this.currentKey);
            const nextIdx = (curIdx + 1) % SONG_KEYS.length;
            this.play(SONG_KEYS[nextIdx]);
        }

        updateWidgetUI() {
            const disk = document.getElementById('floating-vinyl-disk');
            const stylus = document.getElementById('floating-stylus');
            const title = document.getElementById('floating-song-title');
            const artist = document.getElementById('floating-song-artist');

            const info = SONG_INFO[this.currentKey];

            if (title) title.textContent = info.title;
            if (artist) artist.textContent = info.artist;

            if (this.isPlaying) {
                if (disk) disk.classList.add('spinning-vinyl');
                if (stylus) stylus.classList.add('playing');
            } else {
                if (disk) disk.classList.remove('spinning-vinyl');
                if (stylus) stylus.classList.remove('playing');
            }
        }

        registerCallback(cb) {
            this.onStateChangeCallbacks.push(cb);
            // Fire immediately to sync initial load state
            cb(this.currentKey, this.isPlaying);
        }

        triggerStateChange() {
            for (const cb of this.onStateChangeCallbacks) {
                cb(this.currentKey, this.isPlaying);
            }
        }
    }

    // Instansiasi tunggal global
    window.LoveeMusic = new GlobalMusicPlayer();
})();
