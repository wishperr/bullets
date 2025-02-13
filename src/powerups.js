import { enemies } from "./enemies.js";
import { getPlayer, addXP } from "./player.js";
import { CAMERA, ENEMY_TYPES } from './constants.js';
import { gamePaused } from "./game.js";
import { updateUI } from "./ui.js";
import { getDistance } from './utils.js';
import { createShockwave } from './particles.js';

// Game state and configuration
export let powerups = [];
let spinningStarActive = false;
export let spinningStar = null;

const STAR_CONFIG = {
    OUTER_SIZE: 60,        // Length of the star's points
    INNER_SIZE: 5,         // How "pinched" the star is at its center
    POINTS: 3,             // Number of points
    ORBIT_SPEED: 0.1,      // How fast it circles the player
    SPIN_SPEED: 0.3,       // How fast it spins
    ORBIT_RADIUS: 150,     // Distance from player
    DAMAGE: 2,             // Damage per hit
};

export function dropPowerup(pos) {
    if (Math.random() < 0.2) { // 20% chance to drop a powerup
        const types = ["killAll", "extraHealth", "invincible", "spinningStar"];
        const type = types[Math.floor(Math.random() * types.length)];
        powerups.push({ pos, type });
        console.log(`Powerup dropped: ${type} at (${pos.x}, ${pos.y})`);
    }
}

export function updatePowerups() {
    const player = getPlayer();
    powerups = powerups.filter(powerup => {
        if (getDistance(player.pos.x, player.pos.y, powerup.pos.x, powerup.pos.y) < player.radius + 10) {
            handlePowerupEffect(powerup.type);
            console.log(`Player picked up powerup: ${powerup.type}`);
            return false; // Remove powerup after pickup
        }
        return true;
    });

    // Update spinning star position if active
    if (spinningStarActive && spinningStar) {
        updateSpinningStar();
    }
}

function handlePowerupEffect(type) {
    const player = getPlayer();
    switch (type) {
        case "killAll":
            killAllEnemiesInView();
            break;
        case "extraHealth":
            player.health += 5;
            console.log("Player gained 5 extra health!");
            break;
        case "invincible":
            player.invincible = true;
            player.invincibleRemaining = 5000; // Store remaining time
            console.log("Player is now invincible for 5 seconds!");

            function countdownInvincibility() {
                if (!player.invincible) return; // If it was removed, stop the countdown

                if (gamePaused) {
                    setTimeout(countdownInvincibility, 1000); // Wait and retry
                    return;
                }

                player.invincibleRemaining -= 1000;
                updateUI(0, player.xp, player.level, player.xpToNextLevel, player.health); // Pass required parameters

                if (player.invincibleRemaining > 0) {
                    setTimeout(countdownInvincibility, 1000);
                } else {
                    player.invincible = false;
                    console.log("Invincibility wore off.");
                    updateUI(0, player.xp, player.level, player.xpToNextLevel, player.health); // Pass required parameters
                }
            }

            countdownInvincibility();
            break;
        case "spinningStar":
            spawnSpinningStar();
            break;
    }
}

function spawnSpinningStar() {
    if (spinningStarActive) return;
    spinningStarActive = true;
    const player = getPlayer();
    spinningStar = {
        angle: 0,
        spinAngle: 0, // Add spinning angle
        radius: STAR_CONFIG.ORBIT_RADIUS,
        color: "pink",
        duration: 5000,
        pos: { x: player.pos.x, y: player.pos.y }
    };
}

function updateSpinningStar() {
    if (!spinningStarActive || !spinningStar) return;

    const player = getPlayer();
    
    // Update spinning star position and spin
    spinningStar.angle += STAR_CONFIG.ORBIT_SPEED;
    spinningStar.spinAngle += STAR_CONFIG.SPIN_SPEED;
    spinningStar.pos.x = player.pos.x + Math.cos(spinningStar.angle) * spinningStar.radius;
    spinningStar.pos.y = player.pos.y + Math.sin(spinningStar.angle) * spinningStar.radius;

    // Check for collisions with enemies
    enemies.forEach((enemy, index) => {
        if (getDistance(spinningStar.pos.x, spinningStar.pos.y, enemy.pos.x, enemy.pos.y) < 20 + enemy.radius) {
            enemy.health -= STAR_CONFIG.DAMAGE;
            console.log(`Spinning Star hit ${enemy.type} enemy! Enemy health: ${enemy.health}`);
            if (enemy.health <= 0) {
                console.log(`Spinning Star killed ${enemy.type} enemy!`);
                enemies.splice(index, 1);
                addXP(ENEMY_TYPES[enemy.type.toUpperCase()].EXP);
            }
        }
    });

    // Check duration and cleanup
    spinningStar.duration -= 16;
    if (spinningStar.duration <= 0) {
        console.log('Spinning Star power-up expired');
        spinningStarActive = false;
        spinningStar = null;
    }
}

export function killAllEnemiesInView() {
    const player = getPlayer();
    let totalXP = 0;

    // Create shockwave effect before removing enemies
    createShockwave(player.pos.x, player.pos.y);

    // Find enemies in the camera view
    const enemiesInView = enemies.filter(e => 
        e.pos.x >= player.pos.x - CAMERA.WIDTH / 2 &&
        e.pos.x <= player.pos.x + CAMERA.WIDTH / 2 &&
        e.pos.y >= player.pos.y - CAMERA.HEIGHT / 2 &&
        e.pos.y <= player.pos.y + CAMERA.HEIGHT / 2
    );

    // Add small delay to remove enemies so shockwave is visible
    setTimeout(() => {
        // Calculate and award XP
        enemiesInView.forEach(e => {
            totalXP += ENEMY_TYPES[e.type.toUpperCase()].EXP;
        });

        // Remove enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (enemiesInView.includes(enemies[i])) {
                enemies.splice(i, 1);
            }
        }

        console.log(`Kill All Power-up used! ${enemiesInView.length} enemies killed, gaining ${totalXP} XP.`);
        addXP(totalXP);
    }, 100); // Small delay to match shockwave animation
}

export function drawPowerups(ctx, camera) {
    // Draw regular powerups
    powerups.forEach(p => {
        let screenX = p.pos.x - camera.x;
        let screenY = p.pos.y - camera.y;
        
        ctx.beginPath();
        
        switch (p.type) {
            case "killAll":
                ctx.fillStyle = "yellow";
                drawStar(ctx, screenX, screenY, 5, 12, 5);
                break;
            case "extraHealth":
                ctx.fillStyle = "red";
                drawStar(ctx, screenX, screenY, 5, 12, 5);
                break;
            case "invincible":
                ctx.fillStyle = "cyan";
                drawStar(ctx, screenX, screenY, 5, 12, 5);
                break;
            case "spinningStar":
                ctx.fillStyle = "pink";
                ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 100); // Blinking effect
                drawStar(ctx, screenX, screenY, 5, 12, 5);
                ctx.globalAlpha = 1.0;
                break;
        }
        
        ctx.fill();
    });

    // Draw active spinning star
    if (spinningStarActive && spinningStar) {
        ctx.fillStyle = spinningStar.color;
        let screenX = spinningStar.pos.x - camera.x;
        let screenY = spinningStar.pos.y - camera.y;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(spinningStar.spinAngle);
        
        // Draw three-pointed star with inner points
        ctx.beginPath();
        for (let i = 0; i < STAR_CONFIG.POINTS; i++) {
            const outerAngle = (i * 2 * Math.PI / STAR_CONFIG.POINTS) - Math.PI / 2;
            const innerAngle = outerAngle + Math.PI / STAR_CONFIG.POINTS;
            
            if (i === 0) {
                ctx.moveTo(Math.cos(outerAngle) * STAR_CONFIG.OUTER_SIZE, Math.sin(outerAngle) * STAR_CONFIG.OUTER_SIZE);
            } else {
                ctx.lineTo(Math.cos(outerAngle) * STAR_CONFIG.OUTER_SIZE, Math.sin(outerAngle) * STAR_CONFIG.OUTER_SIZE);
            }
            
            // Add inner point
            ctx.lineTo(Math.cos(innerAngle) * STAR_CONFIG.INNER_SIZE, Math.sin(innerAngle) * STAR_CONFIG.INNER_SIZE);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

function drawStar(ctx, x, y, points, outerRadius, innerRadius) {
    let angle = Math.PI / points;
    ctx.beginPath();
    for (let i = 0; i < 2 * points; i++) {
        let r = i % 2 === 0 ? outerRadius : innerRadius;
        let posX = x + Math.cos(i * angle) * r;
        let posY = y + Math.sin(i * angle) * r;
        ctx.lineTo(posX, posY);
    }
    ctx.closePath();
}
