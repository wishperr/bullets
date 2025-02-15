import { getPlayer } from './player.js';
import { CAMERA, ENEMY_TYPES } from './constants.js';

export let particles = [];
export let shockwaves = [];

export function createExplosion(x, y, color = "orange", particleCount = 10, isShockwaveKill = false, isLaserKill = false, options = {}) {
    // Add rage transformation effect
    if (options.isRageTransform) {
        // Create an expanding ring effect
        const numParticles = 30;
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 * i) / numParticles;
            const speed = 3 * (options.velocityMultiplier || 1);
            particles.push({
                pos: { x, y },
                vel: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                radius: 3,
                life: 30,
                color: color,
                isRageParticle: true,
                alpha: 1
            });
        }
        return;
    }

    // Add continuous rage aura effect
    if (options.isRageAura) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 15; // Random distance from enemy
        particles.push({
            pos: {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance
            },
            vel: {
                x: (Math.random() - 0.5) * 0.5,
                y: (Math.random() - 0.5) * 0.5
            },
            radius: Math.random() * 2 + 1,
            life: Math.random() * 20 + 10,
            color: color,
            isRageParticle: true,
            alpha: 0.8
        });
        return;
    }

    if (options.upwardForce) {
        // Enhanced burning effect for boss
        if (options.fromBoss) {
            const baseAngle = options.angle;
            for (let i = 0; i < particleCount; i++) {
                // Spread particles in a cone from the spawn point
                const spreadAngle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.5;
                const speed = (1.5 + Math.random() * 2) * (options.velocityMultiplier || 1);
                
                particles.push({
                    pos: { x, y },
                    vel: {
                        x: Math.cos(spreadAngle) * speed,
                        y: Math.sin(spreadAngle) * speed
                    },
                    radius: Math.random() * 3 + 2,
                    life: Math.random() * 20 + 15,
                    color: color,
                    isBurning: true,
                    alpha: 1
                });
            }
            return;
        }
        
        // Original upward force behavior for non-boss particles
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.PI/2 + (Math.random() - 0.5) * 0.5; // Mostly upward direction
            const speed = (1 + Math.random() * 2) * (options.velocityMultiplier || 1);
            particles.push({
                pos: { x, y },
                vel: {
                    x: Math.cos(angle) * speed,
                    y: -Math.abs(Math.sin(angle) * speed) // Always move upward
                },
                radius: Math.random() * 2 + 1,
                life: Math.random() * 15 + 10,
                color: color,
                isBurning: true
            });
        }
        return;
    }

    if (isLaserKill) {
        // Create brighter electric spark particles
        const sparkColors = [
            '#00ffff',  // Cyan
            '#40ffff',  // Lighter cyan
            '#80ffff',  // Even lighter cyan
            '#ffffff',  // White
            '#aaffff'   // Very light cyan
        ];
        
        for (let i = 0; i < particleCount * 2; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = 2 + Math.random() * 4;
            particles.push({
                pos: { x, y },
                vel: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                radius: 1.5 + Math.random() * 2.5, // Slightly larger radius
                life: 15 + Math.random() * 20,     // Longer life
                color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
                isLaserSpark: true,
                sparkLength: 8 + Math.random() * 12, // Longer sparks
                angle: angle,
                glowSize: 2 + Math.random() * 3     // Add glow effect size
            });
        }
        return;
    }

    const colors = isShockwaveKill ? 
        ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#8B00FF"] : 
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

export function createShockwave(x, y, config) {
    // console.log('Creating shockwave at', x, y, 'with config', config); // Add logging
    // Special handling for killAll powerup shockwave
    if (config.isKillAll) {
        shockwaves.push({
            pos: { x, y },
            radius: 0,
            maxRadius: CAMERA.WIDTH / 2, // Grow to the full width of the camera view
            speed: 3, // Slower speed for more visibility
            lineWidth: 20, // Thicker line for better visibility
            opacity: 1,
            color: "rgb(255, 255, 0)", // Use full opacity
            duration: 250, // Longer duration for more visibility
            gradient: false,
            isKillAll: true
        });
        return;
    }

    // Regular shockwave (for rockets, etc)
    shockwaves.push({
        pos: { x, y },
        radius: 0,
        maxRadius: config.maxRadius || 1200,
        speed: config.speed || 15,
        lineWidth: config.lineWidth || 3,
        opacity: config.startOpacity || 1,
        color: config.color || 'rgba(255, 140, 0, 0.4)',
        duration: config.duration || 20,
        gradient: true
    });
}

export function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        if (!p.isFlash) {
            p.pos.x += p.vel.x;
            p.pos.y += p.vel.y;
            
            if (p.isRageParticle) {
                p.alpha = Math.max(0, p.life / 30);
                // Add slight spiral effect for rage particles
                if (p.vel.x !== 0 || p.vel.y !== 0) {
                    const speed = Math.sqrt(p.vel.x * p.vel.x + p.vel.y * p.vel.y);
                    const angle = Math.atan2(p.vel.y, p.vel.x) + 0.1;
                    p.vel.x = Math.cos(angle) * speed;
                    p.vel.y = Math.sin(angle) * speed;
                }
            }
            
            // Add upward acceleration for burning particles
            if (p.isBurning) {
                // Enhanced burning particle behavior
                if (p.alpha) {
                    p.alpha = Math.max(0, p.life / 20);
                }
                p.radius *= 0.97; // Slightly slower size reduction
                
                // Add some random movement
                p.vel.x += (Math.random() - 0.5) * 0.1;
                p.vel.y += (Math.random() - 0.5) * 0.1;
                
                // Slow down particles gradually
                p.vel.x *= 0.98;
                p.vel.y *= 0.98;
            }

            if (p.isLaserSpark) {
                p.sparkLength *= 0.9; // Shrink spark length over time
            }
        }
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update shockwaves with slower fade
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        let sw = shockwaves[i];
        sw.radius += sw.speed;
        // Slower opacity fade based on initial opacity
        sw.opacity = Math.max(0, sw.opacity * (1 - (sw.radius / sw.maxRadius) * 0.5));

        if (sw.radius >= sw.maxRadius) {
            shockwaves.splice(i, 1);
        }
    }
}

export function drawParticles(ctx, camera) {
    particles.forEach(p => {
        if (p.isRageParticle) {
            ctx.globalAlpha = p.alpha;
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (p.isBurning) {
            // Enhanced burning particle rendering
            ctx.globalAlpha = p.alpha || p.life / 25;
            
            // Add glow effect for burning particles
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.pos.x - camera.x, p.pos.y - camera.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Reset shadow
            ctx.shadowBlur = 0;
        } else if (p.isLaserSpark) {
            // Add glow effect
            ctx.shadowBlur = p.glowSize * 5;
            ctx.shadowColor = p.color;
            
            // Draw electrical spark effect
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.radius;
            ctx.globalAlpha = p.life / 30;
            
            ctx.beginPath();
            const startX = p.pos.x - camera.x;
            const startY = p.pos.y - camera.y;
            const endX = startX + Math.cos(p.angle) * p.sparkLength;
            const endY = startY + Math.sin(p.angle) * p.sparkLength;
            
            // Create zigzag effect
            ctx.moveTo(startX, startY);
            const segments = 3;
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const x = startX + (endX - startX) * t;
                const y = startY + (endY - startY) * t;
                const offset = (Math.random() - 0.5) * 4;
                ctx.lineTo(x + Math.cos(p.angle + Math.PI/2) * offset, 
                          y + Math.sin(p.angle + Math.PI/2) * offset);
            }
            ctx.stroke();
            
            // Reset glow effect
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        } else if (p.isFlash) {
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

    // Reset context properties
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Draw enhanced shockwaves
    shockwaves.forEach(sw => {
        // console.log('Drawing shockwave at', sw.pos.x, sw.pos.y, 'with radius', sw.radius); // Add logging
        ctx.save();
        if (sw.gradient) {
            const gradient = ctx.createRadialGradient(
                sw.pos.x - camera.x, sw.pos.y - camera.y, sw.radius * (sw.isKillAll ? 0.5 : 0.8), // Different inner radius for killAll
                sw.pos.x - camera.x, sw.pos.y - camera.y, sw.radius
            );
            
            if (sw.isKillAll) {
                gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');   // Bright yellow core
                gradient.addColorStop(0.6, 'rgba(255, 200, 0, 0.8)'); // Orange-yellow middle
                gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');     // Fade to transparent
            } else {
                gradient.addColorStop(0, sw.color);
                gradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
            }
            ctx.strokeStyle = gradient;
        } else {
            ctx.strokeStyle = sw.color;
        }
        
        ctx.lineWidth = sw.lineWidth;
        ctx.globalAlpha = sw.opacity;
        ctx.beginPath();
        ctx.arc(sw.pos.x - camera.x, sw.pos.y - camera.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });
}
