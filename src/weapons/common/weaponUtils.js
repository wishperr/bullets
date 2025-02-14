import { getDistance } from '../../utils.js';
import { enemies } from '../../enemies.js';

export function findClosestEnemy(player) {
    if (enemies.length === 0) return null;
    return enemies.reduce((closest, enemy) => {
        const distance = getDistance(player.pos.x, player.pos.y, enemy.pos.x, enemy.pos.y);
        return distance < (closest?.distance || Infinity) ? { enemy, distance } : closest;
    }, null)?.enemy;
}

export function findClosestEnemyToPoint(x, y, excludeEnemies) {
    return enemies
        .filter(enemy => !excludeEnemies.has(enemy))
        .reduce((closest, enemy) => {
            const distance = getDistance(x, y, enemy.pos.x, enemy.pos.y);
            if (!closest || distance < closest.distance) {
                return { enemy, distance };
            }
            return closest;
        }, null)?.enemy;
}

export function pointToLineDistance(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineEnd.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

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