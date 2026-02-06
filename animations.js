/**
 * Git Visualizer - Advanced Animation Engine
 * Particle effects, motion paths, and visual feedback
 */

class AnimationEngine {
    constructor() {
        this.container = document.querySelector('.visual-panel');
        this.activeAnimations = [];
    }

    // ========== PARTICLE SYSTEM ==========

    /**
     * Create particle explosion effect
     */
    particles(type, x, y, options = {}) {
        const defaults = {
            count: 20,
            spread: 100,
            duration: 1000,
            colors: ['#00ff41', '#00cc33', '#009922'],
            size: 8
        };
        const config = { ...defaults, ...options };

        for (let i = 0; i < config.count; i++) {
            const particle = document.createElement('div');
            particle.className = `particle particle-${type}`;

            const angle = (Math.PI * 2 * i) / config.count;
            const velocity = 50 + Math.random() * config.spread;
            const color = config.colors[Math.floor(Math.random() * config.colors.length)];

            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${config.size}px;
                height: ${config.size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 99999;
                box-shadow: 0 0 ${config.size}px ${color};
            `;

            document.body.appendChild(particle);

            // Animate particle
            const destX = x + Math.cos(angle) * velocity;
            const destY = y + Math.sin(angle) * velocity;

            particle.animate([
                { transform: 'scale(1)', opacity: 1 },
                { transform: `translate(${destX - x}px, ${destY - y}px) scale(0)`, opacity: 0 }
            ], {
                duration: config.duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => particle.remove();
        }
    }

    /**
     * Confetti effect for celebrations
     */
    confetti(x, y, count = 30) {
        const colors = ['#00ff41', '#ffff00', '#00ffff', '#ff00ff', '#ff6600'];

        for (let i = 0; i < count; i++) {
            const confetto = document.createElement('div');
            confetto.className = 'confetto';

            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 5 + Math.random() * 8;
            const angle = Math.random() * Math.PI * 2;
            const velocity = 100 + Math.random() * 150;
            const rotation = Math.random() * 720 - 360;

            confetto.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size * 0.6}px;
                background: ${color};
                pointer-events: none;
                z-index: 99999;
            `;

            document.body.appendChild(confetto);

            const destX = x + Math.cos(angle) * velocity;
            const destY = y + Math.sin(angle) * velocity + 100; // gravity

            confetto.animate([
                { transform: 'rotate(0deg)', opacity: 1 },
                { transform: `translate(${destX - x}px, ${destY - y}px) rotate(${rotation}deg)`, opacity: 0 }
            ], {
                duration: 1500,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => confetto.remove();
        }
    }

    /**
     * Sparkle effect
     */
    sparkle(element, duration = 1500) {
        const rect = element.getBoundingClientRect();
        const sparkleCount = 8;

        for (let i = 0; i < sparkleCount; i++) {
            setTimeout(() => {
                const spark = document.createElement('div');
                spark.innerHTML = '✨';
                spark.style.cssText = `
                    position: fixed;
                    left: ${rect.left + Math.random() * rect.width}px;
                    top: ${rect.top + Math.random() * rect.height}px;
                    font-size: 16px;
                    pointer-events: none;
                    z-index: 99999;
                `;
                document.body.appendChild(spark);

                spark.animate([
                    { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                    { transform: 'scale(1.5) rotate(180deg)', opacity: 0 }
                ], { duration: 600, easing: 'ease-out' }).onfinish = () => spark.remove();
            }, i * (duration / sparkleCount));
        }
    }

    // ========== MOTION PATHS ==========

    /**
     * Animate element along bezier curve path
     */
    async motionPath(element, startRect, endRect, options = {}) {
        const defaults = {
            duration: 800,
            icon: '📦',
            trail: true,
            rotation: 360,
            scale: [1, 1.2, 1],
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        };
        const config = { ...defaults, ...options };

        // Create flying element
        const flyer = document.createElement('div');
        flyer.className = 'motion-flyer';
        flyer.innerHTML = config.icon;
        flyer.style.cssText = `
            position: fixed;
            left: ${startRect.left + startRect.width / 2}px;
            top: ${startRect.top + startRect.height / 2}px;
            font-size: 32px;
            z-index: 99999;
            pointer-events: none;
            filter: drop-shadow(0 0 10px #00ff41);
        `;
        document.body.appendChild(flyer);

        // Calculate bezier control points
        const startX = startRect.left + startRect.width / 2;
        const startY = startRect.top + startRect.height / 2;
        const endX = endRect.left + endRect.width / 2;
        const endY = endRect.top + endRect.height / 2;

        // Create trail effect
        if (config.trail) {
            this.createTrail(startX, startY, endX, endY, config.duration);
        }

        // Animate along path
        return new Promise(resolve => {
            flyer.animate([
                {
                    transform: `translate(0, 0) rotate(0deg) scale(${config.scale[0]})`,
                    opacity: 1
                },
                {
                    transform: `translate(${(endX - startX) / 2}px, ${(endY - startY) / 2 - 50}px) rotate(${config.rotation / 2}deg) scale(${config.scale[1]})`,
                    opacity: 1
                },
                {
                    transform: `translate(${endX - startX}px, ${endY - startY}px) rotate(${config.rotation}deg) scale(${config.scale[2]})`,
                    opacity: 1
                }
            ], {
                duration: config.duration,
                easing: config.easing
            }).onfinish = () => {
                // Arrival effect
                this.particles('burst', endX, endY, { count: 12, spread: 60 });
                flyer.remove();
                resolve();
            };
        });
    }

    /**
     * Create trail effect behind moving element
     */
    createTrail(startX, startY, endX, endY, duration) {
        const trailCount = 10;
        const interval = duration / trailCount;

        for (let i = 0; i < trailCount; i++) {
            setTimeout(() => {
                const progress = i / trailCount;
                const x = startX + (endX - startX) * progress;
                const y = startY + (endY - startY) * progress - Math.sin(progress * Math.PI) * 50;

                const trail = document.createElement('div');
                trail.className = 'trail-dot';
                trail.style.cssText = `
                    position: fixed;
                    left: ${x}px;
                    top: ${y}px;
                    width: 8px;
                    height: 8px;
                    background: #00ff41;
                    border-radius: 50%;
                    opacity: ${1 - progress};
                    pointer-events: none;
                    z-index: 99998;
                    box-shadow: 0 0 10px #00ff41;
                `;
                document.body.appendChild(trail);

                setTimeout(() => trail.remove(), 500);
            }, i * interval);
        }
    }

    // ========== VISUAL EFFECTS ==========

    /**
     * Flash effect (camera flash for commit)
     */
    flash(color = '#ffffff', duration = 150) {
        const flash = document.createElement('div');
        flash.className = 'screen-flash';
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${color};
            z-index: 999999;
            pointer-events: none;
        `;
        document.body.appendChild(flash);

        flash.animate([
            { opacity: 0.8 },
            { opacity: 0 }
        ], { duration, easing: 'ease-out' }).onfinish = () => flash.remove();
    }

    /**
     * Glow pulse effect on element
     */
    glowPulse(element, color = '#00ff41', count = 3) {
        const originalBoxShadow = element.style.boxShadow;
        let pulseCount = 0;

        const pulse = () => {
            element.animate([
                { boxShadow: `0 0 5px ${color}` },
                { boxShadow: `0 0 30px ${color}, 0 0 60px ${color}` },
                { boxShadow: `0 0 5px ${color}` }
            ], { duration: 400, easing: 'ease-in-out' }).onfinish = () => {
                pulseCount++;
                if (pulseCount < count) pulse();
                else element.style.boxShadow = originalBoxShadow;
            };
        };
        pulse();
    }

    /**
     * Shake effect (for errors/warnings)
     */
    shake(element, intensity = 5) {
        element.animate([
            { transform: 'translateX(0)' },
            { transform: `translateX(-${intensity}px)` },
            { transform: `translateX(${intensity}px)` },
            { transform: `translateX(-${intensity}px)` },
            { transform: `translateX(${intensity}px)` },
            { transform: 'translateX(0)' }
        ], { duration: 400, easing: 'ease-in-out' });
    }

    /**
     * Explosion effect (for hard reset)
     */
    explosion(x, y) {
        // Screen shake
        document.body.animate([
            { transform: 'translate(0, 0)' },
            { transform: 'translate(-5px, -5px)' },
            { transform: 'translate(5px, 5px)' },
            { transform: 'translate(-3px, 3px)' },
            { transform: 'translate(0, 0)' }
        ], { duration: 300 });

        // Red flash
        this.flash('#ff0000', 200);

        // Explosion particles
        this.particles('explosion', x, y, {
            count: 40,
            spread: 200,
            colors: ['#ff0000', '#ff6600', '#ffff00', '#ff3333'],
            size: 12,
            duration: 800
        });

        // Shrapnel effect
        for (let i = 0; i < 10; i++) {
            const shrapnel = document.createElement('div');
            shrapnel.innerHTML = '💥';
            shrapnel.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                font-size: 24px;
                z-index: 99999;
                pointer-events: none;
            `;
            document.body.appendChild(shrapnel);

            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;

            shrapnel.animate([
                { transform: 'scale(1)', opacity: 1 },
                { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(2)`, opacity: 0 }
            ], { duration: 600, easing: 'ease-out' }).onfinish = () => shrapnel.remove();
        }
    }

    // ========== ZONE EFFECTS ==========

    /**
     * Activate zone with glow
     */
    activateZone(zoneId, color = '#00ff41') {
        const zone = document.getElementById(zoneId);
        if (!zone) return;

        zone.style.transition = 'all 0.3s ease';
        zone.style.opacity = '1';
        zone.style.borderColor = color;
        zone.style.boxShadow = `0 0 20px ${color}, inset 0 0 20px rgba(0, 255, 65, 0.1)`;

        // Pulse effect
        this.glowPulse(zone, color, 2);
    }

    /**
     * Deactivate zone
     */
    deactivateZone(zoneId) {
        const zone = document.getElementById(zoneId);
        if (!zone) return;

        zone.style.opacity = '0.5';
        zone.style.borderColor = '#333';
        zone.style.boxShadow = 'none';
    }

    // ========== FILE ANIMATIONS ==========

    /**
     * Spawn files with staggered animation
     */
    async spawnFiles(container, files, delay = 200) {
        for (let i = 0; i < files.length; i++) {
            await this.delay(delay);

            const file = files[i];
            const el = document.createElement('div');
            el.className = 'file-item file-spawning';
            el.innerHTML = `
                <i class="ph ${file.icon || 'ph-file'}"></i>
                <span>${file.name}</span>
                <span class="status ${file.status}">${file.status === 'untracked' ? 'U' : 'M'}</span>
            `;
            el.style.cssText = `
                opacity: 0;
                transform: translateY(-20px);
            `;
            container.appendChild(el);

            // Animate in
            el.animate([
                { opacity: 0, transform: 'translateY(-20px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], { duration: 300, easing: 'ease-out', fill: 'forwards' });
        }
    }

    /**
     * Remove files with animation
     */
    async removeFiles(container, delay = 100) {
        const files = container.querySelectorAll('.file-item');
        for (const file of files) {
            file.animate([
                { opacity: 1, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0.5)' }
            ], { duration: 200, easing: 'ease-in' }).onfinish = () => file.remove();
            await this.delay(delay);
        }
    }

    // ========== UTILITY ==========

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get element center coordinates
     */
    getCenter(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            rect
        };
    }
}

// Global instance
window.animEngine = new AnimationEngine();
