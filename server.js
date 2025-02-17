import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

const lobbies = new Map(); // Store active lobbies

// Generate a fixed lobby code for testing
function generateLobbyCode() {
    return "123";
}

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch (data.type) {
            case 'CREATE_LOBBY':
                const lobbyCode = generateLobbyCode();
                lobbies.set(lobbyCode, {
                    host: ws,
                    players: [{ ws, isHost: true }],
                    gameStarted: false
                });
                ws.send(JSON.stringify({
                    type: 'LOBBY_CREATED',
                    lobbyCode
                }));
                break;

            case 'JOIN_LOBBY':
                const lobby = lobbies.get(data.lobbyCode);
                if (!lobby) {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'Lobby not found'
                    }));
                    return;
                }
                
                if (lobby.gameStarted) {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'Game already started'
                    }));
                    return;
                }

                lobby.players.push({ ws, isHost: false });
                
                // Notify host that player joined
                lobby.host.send(JSON.stringify({
                    type: 'PLAYER_JOINED'
                }));
                
                // Notify joining player of successful join
                ws.send(JSON.stringify({
                    type: 'JOINED_LOBBY'
                }));
                break;

            case 'START_GAME':
                const hostLobby = Array.from(lobbies.values())
                    .find(l => l.host === ws);
                
                if (!hostLobby) {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'Not a lobby host'
                    }));
                    return;
                }

                hostLobby.gameStarted = true;
                hostLobby.players.forEach(player => {
                    player.ws.send(JSON.stringify({
                        type: 'GAME_STARTED'
                    }));
                });
                break;

            case 'GAME_STATE':
                const playerLobby = Array.from(lobbies.values())
                    .find(l => l.players.some(p => p.ws === ws));
                
                if (playerLobby) {
                    // Broadcast game state to other players
                    playerLobby.players.forEach(player => {
                        if (player.ws !== ws) {
                            player.ws.send(JSON.stringify({
                                type: 'GAME_STATE',
                                state: data.state
                            }));
                        }
                    });
                }
                break;

            case 'SYNC_GAME_STATE':
                const syncLobby = Array.from(lobbies.values())
                    .find(l => l.players.some(p => p.ws === ws));
                
                if (syncLobby && syncLobby.host === ws) {
                    // Only host can send sync state, broadcast to other players
                    syncLobby.players.forEach(player => {
                        if (player.ws !== ws) {
                            player.ws.send(JSON.stringify({
                                type: 'SYNC_GAME_STATE',
                                state: data.state
                            }));
                        }
                    });
                }
                break;

            case 'PLAYER_PAUSE':
                const pauseLobby = Array.from(lobbies.values())
                    .find(l => l.players.some(p => p.ws === ws));
                
                if (pauseLobby) {
                    // Broadcast pause state to all players
                    pauseLobby.players.forEach(player => {
                        if (player.ws !== ws) {
                            player.ws.send(JSON.stringify({
                                type: 'PLAYER_PAUSE',
                                playerId: data.playerId,
                                isPaused: data.isPaused
                            }));
                        }
                    });
                }
                break;
        }
    });

    ws.on('close', () => {
        // Remove player from lobby and cleanup empty lobbies
        for (const [code, lobby] of lobbies.entries()) {
            const playerIndex = lobby.players.findIndex(p => p.ws === ws);
            if (playerIndex !== -1) {
                lobby.players.splice(playerIndex, 1);
                
                // If host left, notify other players and close lobby
                if (lobby.host === ws) {
                    lobby.players.forEach(player => {
                        player.ws.send(JSON.stringify({
                            type: 'LOBBY_CLOSED',
                            message: 'Host left the game'
                        }));
                    });
                    lobbies.delete(code);
                } else {
                    // Notify host that player left
                    lobby.host.send(JSON.stringify({
                        type: 'PLAYER_LEFT'
                    }));
                }
                
                if (lobby.players.length === 0) {
                    lobbies.delete(code);
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});