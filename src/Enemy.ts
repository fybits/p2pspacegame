import { Sprite, Texture } from "pixi.js";
import { Vector } from "./utils/Vector";
import { Controls } from "./Controls";

const speed = 150;

export default class Enemy extends Sprite {
    velocity: Vector;

    constructor(imageURL) {
        super(Texture.from(imageURL));
        this.velocity = new Vector(0, 0);
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.tint = 0xff0000;
    }

    update(dt: number) {
        this.x = this.x + this.velocity.x * dt / 1000;
        this.y = this.y + this.velocity.y * dt / 1000;
    }
}