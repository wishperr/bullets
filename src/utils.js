// utils.js
// Utility functions used across the game

export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export function getRandomEdgePosition(width, height) {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    switch (edge) {
        case 0: x = Math.random() * width; y = 0; break;
        case 1: x = Math.random() * width; y = height; break;
        case 2: x = 0; y = Math.random() * height; break;
        case 3: x = width; y = Math.random() * height; break;
    }
    return { x, y };
}
