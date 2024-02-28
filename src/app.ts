
import { Application, Assets, Sprite } from 'pixi.js';
import { PeerRoom } from './PeerRoom';
import Player from './Player';
import { Controls } from './Controls';
import Enemy from './Enemy';

const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 720;

const lobbyControlsContainer = document.querySelector<HTMLDivElement>('div.lobby-controls')!;

const nicknameInput = document.querySelector<HTMLInputElement>('input#nickname')!;
const hostBtn = document.querySelector<HTMLButtonElement>('button#host')!;
const lobbyInput = document.querySelector<HTMLInputElement>('input#lobby')!;
const joinBtn = document.querySelector<HTMLButtonElement>('button#join')!;

const canvasContainer = document.querySelector<HTMLDivElement>('#canvas-container')!;
const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;

const app = new Application<HTMLCanvasElement>({ view: canvas, width: WINDOW_WIDTH, height: WINDOW_HEIGHT });

const storedNickname = localStorage.getItem('nickname');
if (storedNickname) {
    nicknameInput.value = storedNickname;
}

let room: PeerRoom | null = null;

const enemies = new Map<string, Enemy>();

const connectToLobby = (nickname: string, lobbyKey?: string) => {
    localStorage.setItem('nickname', nickname);
    room = new PeerRoom(nickname);
    if (lobbyKey) {
        console.log("connect")
        room.connectToMember(lobbyKey);
    }
    lobbyControlsContainer.hidden = true;
    room.on("message", (address, { type, message }) => {
        switch (type) {
            case 'player-state':
                if (address !== room?.address()) {
                    if (enemies.has(address)) {
                        const enemy = enemies.get(address) as Enemy;
                        enemy.x = message.position.x;
                        enemy.y = message.position.y;
                        enemy.angle = message.angle;
                    } else {
                        const enemy = new Enemy(new URL("/src/imgs/spaceship_sprite.png", import.meta.url).toString());
                        enemies.set(address, enemy);
                        app.stage.addChild(enemy);
                    }
                }
        }
    });
    spawnPlayer(room);
}

hostBtn.addEventListener('click', (e) => {
    connectToLobby(nicknameInput.value);
});

joinBtn.addEventListener('click', (e) => {
    connectToLobby(nicknameInput.value, lobbyInput.value);
})

app.view.tabIndex = 1;
app.view.autofocus = true;
const controls = new Controls(app.view);

const spawnPlayer = (room: PeerRoom) => {
    const player = new Player(room, new URL("/src/imgs/spaceship_sprite.png", import.meta.url).toString());
    app.stage.addChild(player);

    app.ticker.add((dt) => {
        player.update(dt);
    })
}


