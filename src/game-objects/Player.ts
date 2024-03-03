import { Assets, Sprite, Texture } from "pixi.js";
import { Vector } from "../utils/Vector";
import Controls from "../Controls";
import { PeerRoom } from "../PeerRoom";
import IUpdate from "./IUpdate";

const speed = 150;

export default class Player extends Sprite implements IUpdate {
    health = 100;
    velocity: Vector;
    private _room: PeerRoom;

    constructor(room: PeerRoom, imageURL: string) {
        const texture = Texture.from(imageURL);
        texture.rotate = 2;
        super(texture);
        this.velocity = new Vector(0, 0);
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this._room = room;
    }

    update(dt: number) {
        const d: Vector = new Vector(0, 0);
        if (Controls.instance.keyboard['w'])
            d.y += - 1;
        if (Controls.instance.keyboard['a'])
            d.x += -1;
        if (Controls.instance.keyboard['s'])
            d.y += 1;
        if (Controls.instance.keyboard['d'])
            d.x += 1;

        this.angle = (this.angle + d.x * dt * 2) % 360;

        this.velocity = new Vector(
            this.velocity.x * 0.99 + speed * d.y * Math.cos(this.rotation),
            this.velocity.y * 0.99 + speed * d.y * Math.sin(this.rotation)
        );

        this.x = this.x + this.velocity.x * dt / 1000;
        this.y = this.y + this.velocity.y * dt / 1000;

        this._room.send({ type: 'player-state', message: { position: { x: this.x, y: this.y }, angle: this.angle } })
    }
}