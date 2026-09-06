// ============================================
// SEASONAL EFFECTS ENGINE
// ============================================

window.SeasonalEffects = (function () {
    let particleCanvas, particleCtx, particleRequest;
    let particles = [];

    // Default Configuration
    const defaultConfig = {
        type: 'none',
        speed: 1.0,      // Multiplier (0.5x to 2.0x)
        density: 1.0,    // Multiplier (0.5x to 2.0x) - affects count
        size: 1.0        // Multiplier (0.5x to 2.0x)
    };

    let currentConfig = { ...defaultConfig };

    function init(config) {
        // Merge config
        currentConfig = { ...defaultConfig, ...config };
        const type = currentConfig.type;

        // 1. Clean up existing
        if (particleRequest) cancelAnimationFrame(particleRequest);
        particles = [];

        // 2. Remove canvas if type is none
        const existingCanvas = document.getElementById('particle-canvas');
        if (type === 'none' || !type) {
            if (existingCanvas) existingCanvas.remove();
            particleCanvas = null;
            particleCtx = null;
            return;
        }

        // 3. Create Canvas if needed
        if (!existingCanvas) {
            particleCanvas = document.createElement('canvas');
            particleCanvas.id = 'particle-canvas';
            Object.assign(particleCanvas.style, {
                position: 'fixed', top: '0', left: '0',
                width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: '9998' // Behind cart/modals but above content
            });
            document.body.appendChild(particleCanvas);
            particleCtx = particleCanvas.getContext('2d');

            // Resize handler
            window.addEventListener('resize', resizeParticleCanvas);
            resizeParticleCanvas();
        } else {
            particleCanvas = existingCanvas;
            particleCtx = particleCanvas.getContext('2d');
            // Ensure size matches window if it was already there
            resizeParticleCanvas();
        }

        // 4. Initialize Particles based on type & density
        let baseCount = window.innerWidth < 768 ? 30 : 80;

        // Adjust count based on density multiplier
        // Range 0.1 to 3.0 ideally. 
        // Let's safe guard it.
        const density = Math.max(0.1, Math.min(3.0, currentConfig.density));
        const count = Math.floor(baseCount * density);

        for (let i = 0; i < count; i++) {
            particles.push(createParticle(type));
        }

        // 5. Start Loop
        loopParticles(type);
    }

    function resizeParticleCanvas() {
        if (particleCanvas) {
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = window.innerHeight;
        }
    }

    function createParticle(type) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;

        // Speed Multiplier
        const speed = Math.max(0.1, currentConfig.speed);

        // Size Multiplier
        const sizeMult = Math.max(0.5, currentConfig.size);

        if (type === 'snow') {
            return {
                x: x, y: y,
                vx: ((Math.random() - 0.5) * 1) * speed,
                vy: (Math.random() * 2 + 1) * speed,
                size: (Math.random() * 3 + 1) * sizeMult,
                color: 'rgba(255, 255, 255, 0.8)',
                type: 'circle'
            };
        } else if (type === 'rain') {
            return {
                x: x, y: y,
                vx: ((Math.random() - 0.5) * 0.5) * speed,
                vy: (Math.random() * 15 + 10) * speed,
                size: (Math.random() * 2 + 20) * sizeMult, // Length
                width: 1 * sizeMult,
                color: 'rgba(174, 194, 224, 0.6)',
                type: 'rect'
            };
        } else if (type === 'confetti') {
            const colors = ['#f5576c', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
            return {
                x: x, y: y,
                vx: ((Math.random() - 0.5) * 4) * speed,
                vy: (Math.random() * 4 + 2) * speed,
                size: (Math.random() * 6 + 4) * sizeMult,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: ((Math.random() - 0.5) * 10) * speed,
                type: 'confetti'
            };
        } else if (type === 'ramadan') {
            const icons = ['🌙', '⭐️', '🏮', '✨'];
            return {
                x: x, y: y,
                vx: ((Math.random() - 0.5) * 0.5) * speed,
                vy: (Math.random() * 1 + 0.5) * speed,
                size: (Math.random() * 20 + 15) * sizeMult,
                text: icons[Math.floor(Math.random() * icons.length)],
                type: 'text'
            };
        } else if (type === 'christmas') {
            const icons = ['❄️', '🎅', '🎄', '🎁', '🦌'];
            return {
                x: x, y: y,
                vx: ((Math.random() - 0.5) * 2) * speed,
                vy: (Math.random() * 2 + 1) * speed,
                size: (Math.random() * 20 + 15) * sizeMult,
                text: icons[Math.floor(Math.random() * icons.length)],
                type: 'text'
            };
        } else if (type === 'eid-fitr') {
            const icons = ['🍬', '☕', '🧁', '🎈', '✨', '🎁'];
            return {
                x: x, y: window.innerHeight + 20,
                vx: ((Math.random() - 0.5) * 1.5) * speed,
                vy: ((Math.random() * 2 + 2) * -1) * speed,
                size: (Math.random() * 25 + 20) * sizeMult,
                text: icons[Math.floor(Math.random() * icons.length)],
                type: 'text'
            };
        } else if (type === 'eid-adha') {
            const icons = ['🐑', '🕌', '🍖', '🐏', '🎈'];
            return {
                x: x, y: window.innerHeight + 20,
                vx: ((Math.random() - 0.5) * 1.5) * speed,
                vy: ((Math.random() * 2 + 1) * -1) * speed,
                size: (Math.random() * 25 + 20) * sizeMult,
                text: icons[Math.floor(Math.random() * icons.length)],
                type: 'text'
            };
        } else if (type === 'desert') {
            return {
                x: x, y: y,
                vx: (Math.random() * 5 + 3) * speed,
                vy: ((Math.random() - 0.5) * 2) * speed,
                size: (Math.random() * 2 + 1) * sizeMult,
                color: 'rgba(210, 180, 140, 0.6)',
                type: 'circle'
            };
        }
    }

    function loopParticles(type) {
        if (!particleCtx || !particleCanvas) return;

        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

        particles.forEach(p => {
            // Update positions
            p.x += p.vx;
            p.y += p.vy;

            // Draw based on type
            if (p.type === 'circle') {
                particleCtx.fillStyle = p.color;
                particleCtx.beginPath();
                particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                particleCtx.fill();
                if (type === 'snow') p.x += Math.sin(p.y * 0.01) * 0.5;
            } else if (p.type === 'rect') {
                particleCtx.fillStyle = p.color;
                particleCtx.fillRect(p.x, p.y, p.width, p.size);
            } else if (p.type === 'confetti') {
                particleCtx.fillStyle = p.color;
                particleCtx.save();
                particleCtx.translate(p.x, p.y);
                particleCtx.rotate(p.rotation * Math.PI / 180);
                particleCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                particleCtx.restore();
                p.rotation += p.rotationSpeed;
            } else if (p.type === 'text') {
                particleCtx.font = `${p.size}px serif`;
                particleCtx.fillText(p.text, p.x, p.y);
            }

            // Reset logic
            const speed = Math.max(0.1, currentConfig.speed);

            if (type !== 'eid-fitr' && type !== 'eid-adha') {
                // Falling / Side scrolling
                if (p.y > window.innerHeight + 50) {
                    p.y = -50;
                    p.x = Math.random() * window.innerWidth;
                }
                if (p.x > window.innerWidth + 50) {
                    if (type === 'desert') {
                        p.x = -50;
                        p.y = Math.random() * window.innerHeight;
                    } else {
                        p.x = 0;
                    }
                } else if (p.x < -50) {
                    if (type === 'desert') p.x = window.innerWidth + 50; else p.x = window.innerWidth;
                }
            } else {
                // Rising (Eids)
                if (p.y < -50) {
                    p.y = window.innerHeight + 50;
                    p.x = Math.random() * window.innerWidth;
                }
            }
        });

        particleRequest = requestAnimationFrame(() => loopParticles(type));
    }

    return {
        init: init
    };
})();
