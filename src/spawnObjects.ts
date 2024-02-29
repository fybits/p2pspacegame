import { Application, Graphics } from 'pixi.js';
import { PeerRoom } from './PeerRoom';
import { Vector } from './utils/Vector';
import Controls from './Controls';
import Player from './game-objects/Player';
import Bullet from './game-objects/Bullet';
import Camera from './game-objects/Camera';
import { isIUpdate } from './game-objects/IUpdate';
import { SPEED_ZOOM_FACTOR, WINDOW_HEIGHT, WINDOW_WIDTH } from './consts';
import { sortedClamp } from './utils';

const starsBackground = (g: Graphics) => {
    const colors = [0xffffff, 0xffffff, 0xff8855, 0x8888ff]
    g.clear();
    for (let i = -300; i < 300; i++) {
        for (let j = -300; j < 300; j++) {
            const colorRand = Math.random();
            const spread = 100;
            const opacityRand = Math.random();
            const sizeRand = Math.random();
            g.beginFill(colors[Math.floor(colorRand * colorRand * colors.length)], opacityRand * opacityRand * Math.max(sizeRand, opacityRand) * 0.6 + 0.4);
            g.drawCircle(i * spread + Math.random() * 100 - 50, j * spread + Math.random() * 100 - 50, sizeRand * sizeRand * sizeRand * 3);
        }
    }
    g.endFill();
}


export const startGame = (app: Application, camera: Camera, room: PeerRoom) => {
    const player = new Player(room, new URL("/src/imgs/spaceship_sprite.png", import.meta.url).toString());
    camera.addChild(player);

    const g = new Graphics();
    starsBackground(g);
    camera.addChild(g);

    let counter = 0;
    const fireRate = 5;
    let time = fireRate;

    app.ticker.add((dt) => {
        for (const child of camera.children) {
            if (isIUpdate(child)) {
                child.update(dt);
            }
        }

        const desiredZoom = Math.min(0.6, SPEED_ZOOM_FACTOR / player.velocity.length);
        camera.desiredZoom = desiredZoom;
        const mousePos = Controls.instance.mouse.position;
        console.log(mousePos);
        const MOUSE_FACTOR = 0.4;
        const cameraOffset = { x: player.x + player.velocity.x / 20 + (mousePos.x - WINDOW_WIDTH / 2) * MOUSE_FACTOR, y: player.y + player.velocity.y / 20 + (mousePos.y - WINDOW_HEIGHT / 2) * MOUSE_FACTOR };
        const desiredPos = new Vector((WINDOW_WIDTH / 2 - cameraOffset.x * desiredZoom), (WINDOW_HEIGHT / 2 - cameraOffset.y * desiredZoom));
        camera.desiredPosition.x = desiredPos.x;
        camera.desiredPosition.y = desiredPos.y;

        time -= dt;
        if (Controls.instance.mouse.pressed && time < 0) {
            time = fireRate;
            const angleRads = player.rotation;
            const angleRange = Math.PI / 12;
            const playerDir = new Vector(-Math.cos(angleRads), -Math.sin(angleRads));
            const playerDirLeft = new Vector(-Math.cos(angleRads - angleRange), -Math.sin(angleRads - angleRange));
            const playerDirRight = new Vector(-Math.cos(angleRads + angleRange), -Math.sin(angleRads + angleRange));
            const mouseWorldPoint = camera.screenToWorldPoint(Controls.instance.mouse.position);
            const perpOffset = new Vector(playerDir.y, -playerDir.x);
            const bulletOffsetSign = (counter % 2) * 2 - 1;
            const bulletPos = new Vector(player.x + bulletOffsetSign * perpOffset.x * 20 + playerDir.x * 120, player.y + bulletOffsetSign * perpOffset.y * 20 + playerDir.y * 120);
            const dir = new Vector(mouseWorldPoint.x - bulletPos.x, mouseWorldPoint.y - bulletPos.y);
            const dirNomalized = dir.normalized;
            const dirClamped = new Vector(sortedClamp(dirNomalized.x, playerDirLeft.x, playerDirRight.x), sortedClamp(dirNomalized.y, playerDirLeft.y, playerDirRight.y));
            camera.addChild(new Bullet(
                bulletPos,
                new Vector(dirClamped.x * 25000, dirClamped.y * 25000),
                Math.atan2(dirClamped.y, dirClamped.x) * 180 / Math.PI,
                new URL("/src/imgs/long-ray.png", import.meta.url).toString()
            ));
            counter++;
        }
        camera.update(dt);
    });
};
