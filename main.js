import { initializeGame, gameLoop } from './src/game.js';

document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById('start-button');
    const introScreen = document.getElementById('intro-screen');
    const canvas = document.getElementById('gameCanvas');
    const ui = document.getElementById('ui');
    const weaponsUi = document.getElementById('weapons-ui');
    const waveInfo = document.getElementById('waveInfo');

    // Hide game elements initially
    canvas.style.display = 'none';
    ui.style.display = 'none';
    weaponsUi.style.display = 'none';
    waveInfo.style.display = 'none';

    startButton.addEventListener('click', () => {
        // Hide intro screen
        introScreen.style.display = 'none';
        
        // Show game elements
        canvas.style.display = 'block';
        ui.style.display = 'block';
        weaponsUi.style.display = 'block';
        waveInfo.style.display = 'block';
        
        // Start the game
        initializeGame();
        gameLoop();
    });
});
