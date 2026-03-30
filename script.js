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
        });
    });

    // ==========================================
    // WebGL Background Mesh (Hexagon Video Engine)
    // ==========================================
    const canvas = document.getElementById('webgl-canvas');
    if (canvas) {
        const gl = canvas.getContext('webgl');
        const video = document.getElementById('bg-video');
        video.play().catch(e => console.log('Video autoplay blocked:', e));

        const vsSource = `
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
                vUv = position * 0.5 + 0.5;
                vUv.y = 1.0 - vUv.y;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fsSource = `
            precision highp float;
            uniform sampler2D u_texture;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform float u_time;
            uniform float u_radius;
            varying vec2 vUv;

            void main() {
                vec2 p = vUv;
                vec2 pxPos = p * u_resolution;
                vec2 pxMouse = u_mouse * u_resolution;
                
                float dist = distance(pxPos, pxMouse);

                // Magnetic Bubble / Lens Effect (Displacement)
                if (dist < u_radius) {
                    float nDist = dist / u_radius;
                    // Bulge outward equation (Sphere relief)
                    float bulge = smoothstep(0.0, 1.0, 1.0 - nDist);
                    p -= (pxPos - pxMouse) / u_resolution * bulge * 0.3; 
                }

                // Breathing Organic Drift (Sine waves)
                p.x += sin(p.y * 5.0 + u_time * 0.001) * 0.01;
                p.y += cos(p.x * 5.0 + u_time * 0.0012) * 0.01;

                // Tiling mechanism
                vec2 tiledUV = fract(p * 3.0); 

                vec4 color = texture2D(u_texture, tiledUV);
                
                // Conversão Luma -> Verde Neon
                float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                vec3 neon = vec3(210.0/255.0, 1.0, 0.0);
                
                gl_FragColor = vec4(neon * luma * 1.5, 1.0);
            }
        `;

        function compileShader(type, source) {
            const s = gl.createShader(type);
            gl.shaderSource(s, source);
            gl.compileShader(s);
            return s;
        }

        const program = gl.createProgram();
        gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource));
        gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource));
        gl.linkProgram(program);
        gl.useProgram(program);

        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        const uRes = gl.getUniformLocation(program, 'u_resolution');
        const uMouse = gl.getUniformLocation(program, 'u_mouse');
        const uTime = gl.getUniformLocation(program, 'u_time');
        const uRadius = gl.getUniformLocation(program, 'u_radius');
        const uTex = gl.getUniformLocation(program, 'u_texture');

        // Spring Mechanics
        let targetX = window.innerWidth / 2, targetY = window.innerHeight / 2, targetR = 0;
        let cX = targetX, cY = targetY, cR = targetR;
        let velX = 0, velY = 0, velR = 0;
        const TENSION = 0.08, FRICTION = 0.8;

        document.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
            targetR = 250.0;
        });
        document.addEventListener('mouseleave', () => targetR = 0);

        function renderGL(now) {
            // Resize canvas to window
            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                gl.viewport(0, 0, canvas.width, canvas.height);
            }

            // Spring Physics (Acceleration/Velocity bounce loop)
            velX += (targetX - cX) * TENSION; 
            velX *= FRICTION; 
            cX += velX;

            velY += (targetY - cY) * TENSION; 
            velY *= FRICTION; 
            cY += velY;

            velR += (targetR - cR) * TENSION; 
            velR *= FRICTION; 
            cR += velR;

            gl.uniform2f(uRes, canvas.width, canvas.height);
            // Flip mouse Y for WebGL coords
            gl.uniform2f(uMouse, cX / canvas.width, cY / canvas.height);
            gl.uniform1f(uTime, now);
            gl.uniform1f(uRadius, Math.max(0, cR));

            if (video.readyState >= video.HAVE_CURRENT_DATA) {
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
            }

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            requestAnimationFrame(renderGL);
        }
        requestAnimationFrame(renderGL);
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
});
