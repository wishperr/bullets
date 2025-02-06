import { gameWidth, gameHeight } from './game.js';
import { showUpgradeOptions } from './ui.js';

let player;
const keys = { w: false, a: false, s: false, d: false };

export function initializePlayer() {
    player = {
        pos: { x: gameWidth / 2, y: gameHeight / 2 },
        speed: 3,
        radius: 10,
        xp: 0,
        level: 1,
        xpToNextLevel: 5,
        attackSpeed: 2000,
        projectileStrength: 1,
        additionalProjectiles: 0,
        weapon: "shotgun", // ✅ Default weapon before upgrading
        health: 1 // ✅ New Health System
    };    
}

export function getPlayer() {
    return player;
}

export function addXP(amount) {
    player.xp += amount;

    if (player.xp >= player.xpToNextLevel) {
        levelUp();
    }
}

function levelUp() {
    player.level++;
    player.xp = 0;
    player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
    showUpgradeOptions();
}

export function handlePlayerMovement() {
    if (keys.w && player.pos.y > 0) player.pos.y -= player.speed;
    if (keys.s && player.pos.y < gameHeight - player.radius * 2) player.pos.y += player.speed;
    if (keys.a && player.pos.x > 0) player.pos.x -= player.speed;
    if (keys.d && player.pos.x < gameWidth - player.radius * 2) player.pos.x += player.speed;
}

export function unlockNewWeapon() {
    alert("New Weapon Unlocked: Shotgun!");
    const player = getPlayer();
    player.weapon = "shotgun"; // ✅ Ensure the weapon changes
    console.log("Weapon changed to:", player.weapon); // ✅ Debugging log
}

document.addEventListener("keydown", (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});