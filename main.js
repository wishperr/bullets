import { initializeGame, gameLoop } from './src/game.js';

// Ensure game.js is initialized first before anything else
document.addEventListener("DOMContentLoaded", () => {
    initializeGame();
    gameLoop();
});
