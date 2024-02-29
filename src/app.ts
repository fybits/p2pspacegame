
import { Application, Buffer, Graphics, ParticleRenderer } from 'pixi.js';
import { PeerRoom } from './PeerRoom';
import Enemy from './game-objects/Enemy';
import Controls from './Controls';
import Camera from './game-objects/Camera';
import IUpdate from './game-objects/IUpdate';
import { startGame } from './spawnObjects';
import { WINDOW_HEIGHT, WINDOW_WIDTH } from './consts';

const lobbyControlsContainer = document.querySelector<HTMLDivElement>('div.lobby-controls')!;

const nicknameInput = document.querySelector<HTMLInputElement>('input#nickname')!;
const hostBtn = document.querySelector<HTMLButtonElement>('button#host')!;
const lobbyInput = document.querySelector<HTMLInputElement>('input#lobby')!;
const joinBtn = document.querySelector<HTMLButtonElement>('button#join')!;

const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;

const app = new Application<HTMLCanvasElement>({ view: canvas, width: WINDOW_WIDTH, height: WINDOW_HEIGHT });

app.view.tabIndex = 1;
app.view.autofocus = true;

const camera = new Camera();
app.stage.addChild(camera);

new Controls(app.view);

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
                        camera.addChild(enemy);
                    }
                }
        }
    });
    startGame(app, camera, room);
}

hostBtn.addEventListener('click', (e) => {
    connectToLobby(nicknameInput.value);
});

joinBtn.addEventListener('click', (e) => {
    connectToLobby(nicknameInput.value, lobbyInput.value);
})



