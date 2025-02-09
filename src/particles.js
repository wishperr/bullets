export let particles = [];

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

export function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

export function drawParticles(ctx, camera) {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}
