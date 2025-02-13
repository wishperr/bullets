import { getPlayer } from './player.js';

export let particles = [];
export let shockwaves = []; // Add shockwaves array

export function createExplosion(x, y, color = "orange", particleCount = 10) {
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            pos: { x, y },
            vel: {
                x: (Math.random() - 0.5) * 3,
                y: (Math.random() - 0.5) * 3
            },
            radius: Math.random() * 3 + 2,
            life: Math.random() * 20 + 10,
            color: color
        });
    }
}

export function createShockwave(x, y) {
    shockwaves.push({
        pos: { x, y },
        radius: 0,
        maxRadius: 1000, // Maximum radius of shockwave
        speed: 15,      // Speed of expansion
        opacity: 1,     // Starting opacity
        color: "yellow"
    });
}

export function updateParticles() {
    // Update regular particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        let sw = shockwaves[i];
        sw.radius += sw.speed;
        sw.opacity = Math.max(0, 1 - (sw.radius / sw.maxRadius));

        if (sw.radius >= sw.maxRadius) {
            shockwaves.splice(i, 1);
        }
    }
}

export function drawParticles(ctx, camera) {
    // Draw regular particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw shockwaves
    shockwaves.forEach(sw => {
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = sw.opacity;
        ctx.beginPath();
        ctx.arc(sw.pos.x - camera.x, sw.pos.y - camera.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    });
}
