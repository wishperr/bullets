import { getPlayer } from './player.js';

export let particles = [];
export let shockwaves = [];

export function createExplosion(x, y, color = "orange", particleCount = 10, isShockwaveKill = false) {
    const colors = isShockwaveKill ? 
        ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#8B00FF"] : // Rainbow colors for shockwave kills
        [color];

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            pos: { x, y },
            vel: {
                x: (Math.random() - 0.5) * 3,
                y: (Math.random() - 0.5) * 3
            },
            radius: Math.random() * 3 + 2,
            life: Math.random() * 20 + 10,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}

export function createShockwave(x, y) {
    // Create brighter and longer-lasting flash effect
    particles.push({
        pos: { x, y },
        radius: 500,
        life: 20,
        isFlash: true,
        color: "white"
    });

    // Create multiple shockwave rings with different properties
    const ringConfigs = [
        { speed: 20, width: 15, color: "#FFD700", delay: 0 },     // Gold, fast and thick
        { speed: 15, width: 10, color: "#FFA500", delay: 100 },   // Orange, medium
        { speed: 12, width: 8, color: "#FF8C00", delay: 200 }     // Dark Orange, slower
    ];

    ringConfigs.forEach(config => {
        setTimeout(() => {
            shockwaves.push({
                pos: { x, y },
                radius: 0,
                maxRadius: 1200,
                speed: config.speed,
                lineWidth: config.width,
                opacity: 1,
                color: config.color,
                gradient: true
            });
        }, config.delay);
    });
}

export function updateParticles() {
    // Update regular particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        if (!p.isFlash) {
            p.pos.x += p.vel.x;
            p.pos.y += p.vel.y;
        }
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update shockwaves with smoother fade
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        let sw = shockwaves[i];
        sw.radius += sw.speed;
        // Slower opacity fade
        sw.opacity = Math.max(0, 1 - (sw.radius / sw.maxRadius) * 0.8);

        if (sw.radius >= sw.maxRadius) {
            shockwaves.splice(i, 1);
        }
    }
}

export function drawParticles(ctx, camera) {
    // Draw regular particles and enhanced flash effect
    particles.forEach(p => {
        if (p.isFlash) {
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (p.life / 20) + ')';
            ctx.beginPath();
            ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius * (1 - p.life / 20), 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw enhanced shockwaves
    shockwaves.forEach(sw => {
        ctx.save();
        if (sw.gradient) {
            const gradient = ctx.createRadialGradient(
                sw.pos.x - camera.x, sw.pos.y - camera.y, sw.radius * 0.8, // Inner radius
                sw.pos.x - camera.x, sw.pos.y - camera.y, sw.radius        // Outer radius
            );
            gradient.addColorStop(0, sw.color);
            gradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
            ctx.strokeStyle = gradient;
        } else {
            ctx.strokeStyle = sw.color;
        }
        
        ctx.lineWidth = sw.lineWidth || 3;
        ctx.globalAlpha = sw.opacity;
        ctx.beginPath();
        ctx.arc(sw.pos.x - camera.x, sw.pos.y - camera.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });
}
