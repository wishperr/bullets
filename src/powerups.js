import { enemies } from "./enemies.js";
import { getPlayer, addXP } from "./player.js";
import { CAMERA } from './constants.js';
import { gamePaused } from "./game.js";
import { updateUI } from "./ui.js";

export let powerups = [];

export function dropPowerup(pos) {
    if (Math.random() < 0.2) { // 20% chance to drop a powerup
        const types = ["killAll", "extraHealth", "invincible"];
        const type = types[Math.floor(Math.random() * types.length)];
        powerups.push({ pos, type });
        console.log(`Powerup dropped: ${type} at (${pos.x}, ${pos.y})`);
    }
}

export function updatePowerups() {
    const player = getPlayer();
    powerups = powerups.filter(powerup => {
        if (Math.hypot(player.pos.x - powerup.pos.x, player.pos.y - powerup.pos.y) < player.radius + 10) {
            handlePowerupEffect(powerup.type);
            console.log(`Player picked up powerup: ${powerup.type}`);
            return false; // Remove powerup after pickup
        }
        return true;
    });
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
                updateUI(); // Update UI countdown

                if (player.invincibleRemaining > 0) {
                    setTimeout(countdownInvincibility, 1000);
                } else {
                    player.invincible = false;
                    console.log("Invincibility wore off.");
                    updateUI();
                }
            }

            countdownInvincibility();
            break;
    }
}


export function killAllEnemiesInView() {
    const player = getPlayer();
    let totalXP = 0; // Track total XP to grant

    // Filter enemies in the camera view
    const enemiesInView = enemies.filter(e => 
        e.pos.x >= player.pos.x - 500 && e.pos.x <= player.pos.x + 500 &&
        e.pos.y >= player.pos.y - 400 && e.pos.y <= player.pos.y + 400
    );

    enemiesInView.forEach(e => {
        totalXP += (e.type === "boss" ? 10 : e.type === "tank" ? 5 : e.type === "shooter" ? 3 : 1);
    });

    // Remove all enemies in view
    enemies.length = enemies.filter(e => !enemiesInView.includes(e)).length;

    console.log(`💀 Kill All Power-up used! ${enemiesInView.length} enemies killed, gaining ${totalXP} XP.`);

    // Add XP after all enemies are removed
    addXP(totalXP);
}

export function drawPowerups(ctx, camera) {
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
        }
        
        ctx.fill();
    });
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
