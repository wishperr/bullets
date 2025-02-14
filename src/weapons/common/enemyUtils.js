import { ENEMY_TYPES } from '../../constants.js';
import { addXP } from '../../player.js';
import { createExplosion } from '../../particles.js';
import { dropPowerup } from '../../powerups.js';
import { updateUI } from '../../ui.js';
import { getPlayer } from '../../player.js';

let killCount = 0;

export function handleEnemyDeath(enemy) {
    killCount++;
    const player = getPlayer();
    const expGained = ENEMY_TYPES[enemy.type.toUpperCase()].EXP;
    addXP(expGained);
    
    if (player) {
        // Update UI with current game state
        updateUI(
            killCount,
            player.xp,
            player.level,
            player.xpToNextLevel,
            player.health
        );
    }
    
    createExplosion(enemy.pos.x, enemy.pos.y, '#ff4400', 10);
    dropPowerup(enemy.pos);
}

export function getKillCount() {
    return killCount;
}

export function resetKillCount() {
    killCount = 0;
    const player = getPlayer();
    if (player) {
        updateUI(0, player.xp, player.level, player.xpToNextLevel, player.health);
    }
}