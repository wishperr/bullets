// Minimap system for rendering a tactical overview of the game
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { getPlayer } from '../player.js';
import { enemies } from '../enemies.js';

const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');

// Set fixed dimensions for the minimap
minimapCanvas.width = 200;
minimapCanvas.height = 200;

// Scale factor for converting game coordinates to minimap coordinates
const scaleX = minimapCanvas.width / GAME_WIDTH;
const scaleY = minimapCanvas.height / GAME_HEIGHT;

export function updateMinimap() {
    // Clear the minimap
    minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    // Draw game boundary
    minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    minimapCtx.strokeRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    const player = getPlayer();
    if (!player) return;

    // Draw player (blue dot)
    minimapCtx.fillStyle = 'blue';
    minimapCtx.beginPath();
    minimapCtx.arc(
        player.pos.x * scaleX,
        player.pos.y * scaleY,
        3,
        0,
        Math.PI * 2
    );
    minimapCtx.fill();

    // Draw enemies
    enemies.forEach(enemy => {
        // Choose color based on enemy type
        minimapCtx.fillStyle = enemy.type === 'boss' ? 'red' : 
                              enemy.type === 'tank' ? 'yellow' :
                              enemy.type === 'shooter' ? 'pink' :
                              enemy.type === 'berserker' ? '#ff4400' : 
                              'green';

        // Draw enemy dot
        minimapCtx.beginPath();
        minimapCtx.arc(
            enemy.pos.x * scaleX,
            enemy.pos.y * scaleY,
            enemy.type === 'boss' ? 4 : 2,
            0,
            Math.PI * 2
        );
        minimapCtx.fill();
    });
}