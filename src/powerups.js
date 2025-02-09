import { getPlayer } from './player.js';
import { enemies } from './enemies.js';
import { CAMERA } from './constants.js';

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
            console.log("Player is now invincible for 5 seconds!");
            setTimeout(() => {
                player.invincible = false;
                console.log("Invincibility wore off.");
            }, 5000);
            break;
    }
}

function killAllEnemiesInView() {
    const player = getPlayer();
    const inViewEnemies = enemies.filter(e => 
        e.pos.x >= player.pos.x - CAMERA.WIDTH / 2 &&
        e.pos.x <= player.pos.x + CAMERA.WIDTH / 2 &&
        e.pos.y >= player.pos.y - CAMERA.HEIGHT / 2 &&
        e.pos.y <= player.pos.y + CAMERA.HEIGHT / 2
    );
    
    console.log(`Killing ${inViewEnemies.length} enemies in view.`);
    
    inViewEnemies.forEach(e => {
        const index = enemies.indexOf(e);
        if (index !== -1) enemies.splice(index, 1);
    });
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
