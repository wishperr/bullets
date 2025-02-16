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

export function pointToLineDistance(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
    } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
    } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
}

export function isMobileDevice() {
    return (window.innerWidth <= 768) || 
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
}

export function adjustIntroScreen() {
    const isMobile = isMobileDevice();
    const introScreen = document.querySelector('#intro-screen');
    const controls = document.querySelector('.controls');

    if (introScreen && isMobile) {
        controls.style.display = 'none';
        introScreen.classList.add('mobile-view');
    }
}

// Watch for orientation changes on mobile
if (isMobileDevice()) {
    window.addEventListener('orientationchange', () => {
        adjustIntroScreen();
    });
}
