document.addEventListener("DOMContentLoaded", () => {
    // Nav background blur on scroll
    const nav = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if(window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Subtle parallax effect for hero text
    const heroBg = document.querySelector('.hero-bg');
    const heroText = document.querySelector('.parallax-text');
    const heroNum = document.querySelector('.hero-number');
    
    window.addEventListener('scroll', () => {
        const scrollData = window.scrollY;
        
        // Only run parallax while hero is visible
        if (scrollData < window.innerHeight) {
            if(heroBg) heroBg.style.transform = `translateY(${scrollData * 0.3}px)`;
            if(heroText) heroText.style.transform = `translateY(${scrollData * -0.15}px)`;
            if(heroNum) heroNum.style.transform = `translateY(${scrollData * -0.05}px) translateX(${scrollData * 0.1}px)`;
        }
    });

    // Media Kit Tabs Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const mediaScreens = document.querySelectorAll('.media-screen');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all buttons and screens
            tabBtns.forEach(b => b.classList.remove('active'));
            mediaScreens.forEach(s => s.classList.remove('active'));

            // Add active to clicked button
            btn.classList.add('active');

            // Find target screen and make it active
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Trigger global WebGL speed update if defined
            if (window.updateWebGLSpeed) {
                window.updateWebGLSpeed(targetId === 'diamante' ? 4.0 : 1.0);
            }
        });
    });

    // ==========================================
    // Hamburger Menu Logic
    // ==========================================
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links li');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('nav-active');
            hamburger.classList.toggle('toggle');
        });

        // Close menu when a link is clicked
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('nav-active');
                hamburger.classList.remove('toggle');
            });
        });
    }



    // Smooth scroll state
    let targetGalleryProgress = 0;
    let currentGalleryProgress = 0;

    // Scroll Gallery Sync Logic
    const gallerySection = document.querySelector('.scroll-gallery-section');
    const galleryContent = document.querySelector('.gallery-content');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const textureOverlay = document.querySelector('.texture-overlay');

    if (gallerySection && galleryContent) {
        window.addEventListener('scroll', () => {
            const rect = gallerySection.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            const totalScrollDistance = rect.height - viewportHeight;
            let rawProgress = -rect.top / totalScrollDistance;
            targetGalleryProgress = Math.max(0, Math.min(1, rawProgress));
        });

        function renderGallery() {
            // Lerp factor for inertial, smooth elastic response
            currentGalleryProgress += (targetGalleryProgress - currentGalleryProgress) * 0.05;
            
            // Move main container up to -280vw (denser map)
            const mainMoveX = currentGalleryProgress * -280; 
            galleryContent.style.transform = `translateX(${mainMoveX}vw)`;
            
            galleryItems.forEach(item => {
                const speed = parseFloat(item.getAttribute('data-speed')) || 1;
                const parallaxOffset = currentGalleryProgress * 100 * (speed - 1);
                item.style.transform = `translateX(${parallaxOffset}vw)`;
                
                const itemRect = item.getBoundingClientRect();
                if (itemRect.left < window.innerWidth * 1.5 && itemRect.right > -window.innerWidth * 0.5) {
                    item.classList.add('visible');
                }
            });

            // Dynamic Background Transition: Black (0,0,0) -> Neon Green (210, 255, 0) -> Black (0,0,0)
            let colorFactor = 0;
            if (currentGalleryProgress < 0.2) {
                colorFactor = currentGalleryProgress / 0.2;
            } else if (currentGalleryProgress > 0.8) {
                colorFactor = (1.0 - currentGalleryProgress) / 0.2;
            } else {
                colorFactor = 1.0;
            }

            const rBG = Math.round(colorFactor * 210);
            const gBG = Math.round(colorFactor * 255);
            const bBG = 0;
            document.body.style.backgroundColor = `rgb(${rBG}, ${gBG}, ${bBG})`;
            
            requestAnimationFrame(renderGallery);
        }
        
        // Start the continuous animation loop
        renderGallery();
    }

    // Fade-in animation for layout sections on scroll
    const fadeElements = document.querySelectorAll('.history-text, .history-image, .section-header');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); 
            }
        });
    }, {
        threshold: 0.15
    });

    fadeElements.forEach((el, index) => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(40px)';
        el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        observer.observe(el);
    });

    // Lazy load JS integration for UI Videos
    const lazyVideos = document.querySelectorAll('.lazy-video');
    if ('IntersectionObserver' in window) {
        const videoObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(video => {
                if (video.isIntersecting) {
                    const vid = video.target;
                    const src = vid.getAttribute('data-src');
                    if (src) {
                        vid.src = src;
                        vid.load();
                        vid.play().catch(e => console.log('Autoplay blocked:', e));
                        vid.removeAttribute('data-src');
                    }
                    observer.unobserve(vid);
                }
            });
        }, { rootMargin: '300px 0px' });

        lazyVideos.forEach(vid => videoObserver.observe(vid));
    } else {
        // Fallback older browsers
        lazyVideos.forEach(vid => {
            vid.src = vid.getAttribute('data-src');
            vid.load();
        });
    }

    // ==========================================
    // TextRoll Engine (Vanilla JS Component Replication)
    // ==========================================
    const STAGGER = 0.035; // Requested mathematically-precise offset limit

    const textRollWords = document.querySelectorAll('.textroll-word');

    textRollWords.forEach(wordObj => {
        const text = wordObj.getAttribute('data-text');
        wordObj.innerHTML = ''; // Limpa a string estática raiz gerando a tela branca
        
        const chars = text.split('');
        const centerIndex = (chars.length - 1) / 2;

        chars.forEach((char, i) => {
            // Emula a lógica center={true} do motion
            const delay = STAGGER * Math.abs(i - centerIndex);

            const charContainer = document.createElement('span');
            charContainer.className = char === ' ' ? 'textroll-char space' : 'textroll-char';

            const origSpan = document.createElement('span');
            origSpan.className = 'char-original';
            origSpan.style.transitionDelay = `${delay}s`;
            origSpan.textContent = char;

            const hoverSpan = document.createElement('span');
            hoverSpan.className = 'char-hover';
            hoverSpan.style.transitionDelay = `${delay}s`;
            hoverSpan.textContent = char;

            charContainer.appendChild(origSpan);
            charContainer.appendChild(hoverSpan);
            wordObj.appendChild(charContainer);
        });
    });

    // ==========================================
    // WebGL Neon Flow (TubesBackground Replica React Expandido)
    // ==========================================
    const tubesCanvas = document.getElementById('tubes-canvas');
    const neonFlowWrapper = document.getElementById('neon-flow-wrapper');

    if (tubesCanvas && neonFlowWrapper) {
        let tubesApp = null;

        const randomColors = (count) => {
            return new Array(count).fill(0).map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
        };

        // Carregamento dinâmico (idêntico ao import do React de CDN)
        import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js')
            .then(module => {
                const TubesCursor = module.default;
                
                // Inicialização fiel à props do componente React
                tubesApp = TubesCursor(tubesCanvas, {
                    tubes: {
                        colors: ["#f967fb", "#53bc28", "#6958d5"],
                        lights: {
                            intensity: 200,
                            colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"]
                        }
                    }
                });

                // Lógica Global de Interação via Click (Randomização) anexada ao master wrapper
                neonFlowWrapper.addEventListener('click', () => {
                    if (tubesApp && tubesApp.tubes) {
                        const newColors = randomColors(3);
                        const newLightsColors = randomColors(4);
                        tubesApp.tubes.setColors(newColors);
                        tubesApp.tubes.setLightsColors(newLightsColors);
                    }
                });
                
                // Gerenciador Simples de Redimensionamento em Janela Responsiva
                const resizeTubes = () => {
                    tubesCanvas.width = neonFlowWrapper.offsetWidth;
                    tubesCanvas.height = neonFlowWrapper.offsetHeight;
                };
                
                window.addEventListener('resize', resizeTubes);
                // Inicial call for exact size
                setTimeout(resizeTubes, 100);
            })
            .catch(err => console.error("Falha Crítica ao carregar TubesBackground Neon Flow WebGL:", err));
    }
});
