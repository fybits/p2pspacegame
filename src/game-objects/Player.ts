import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { Vector } from "../utils/Vector";
import Controls, { KeyState } from "../Controls";
import { PeerRoom } from "../PeerRoom";
import IUpdate from "./IUpdate";

const speed = 200;

export default class Player extends Container implements IUpdate {
    health = 100;
    velocity: Vector;
    graphics: Sprite;
    private _room: PeerRoom;
    private healthBar: TilingSprite;

    constructor(room: PeerRoom, imageURL: string) {
        super();
        this._room = room;
        this.velocity = new Vector(0, 0);

        const bulletTexture = Texture.from(new URL("/src/imgs/long-ray.png", import.meta.url).toString());
        this.healthBar = new TilingSprite(bulletTexture, this.health * 1.5, 16);
        this.healthBar.tileScale = { x: 0.2, y: 0.1 };
        this.healthBar.position = { x: -75, y: -90 };
        this.healthBar.anchor.x = 0;
        this.healthBar.anchor.y = 0.5;
        this.healthBar.tint = 0x00ff00;
        const healthBarBackground = new TilingSprite(bulletTexture, 150, 16);
        healthBarBackground.tileScale = { x: 0.2, y: 0.1 };
        healthBarBackground.position = { x: -75, y: -94 };
        healthBarBackground.anchor.x = 0;
        healthBarBackground.anchor.y = 0.5;
        healthBarBackground.tint = 0xff0000;
        this.addChild(healthBarBackground);
        this.addChild(this.healthBar);

        const texture = Texture.from(imageURL);
        texture.rotate = 2;
        const playerSprite = new Sprite(texture);
        this.graphics = playerSprite;
        this.graphics.anchor.x = 0.5;
        this.graphics.anchor.y = 0.5;
        this.addChild(this.graphics)
    }

    update(dt: number) {
        const d: Vector = new Vector(0, 0);
        if (Controls.instance.keyboard['w'] === KeyState.HELD)
            d.y += - 1;
        if (Controls.instance.keyboard['a'] === KeyState.HELD)
            d.x += -1;
        if (Controls.instance.keyboard['s'] === KeyState.HELD)
            d.y += 1;
        if (Controls.instance.keyboard['d'] === KeyState.HELD)
            d.x += 1;

        this.graphics.angle = (this.graphics.angle + d.x * dt * 2) % 360;
        this.healthBar.width = this.health * 1.5;

        this.velocity = new Vector(
            this.velocity.x * 0.99 + speed * d.y * Math.cos(this.graphics.rotation),
            this.velocity.y * 0.99 + speed * d.y * Math.sin(this.graphics.rotation)
        );

        this.x = this.x + this.velocity.x * dt / 1000;
        this.y = this.y + this.velocity.y * dt / 1000;

        this._room.send({ type: 'player-state', message: { position: { x: this.x, y: this.y }, angle: this.graphics.angle, health: this.health } })
    }
}