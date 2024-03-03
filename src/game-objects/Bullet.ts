import { Sprite, Texture } from "pixi.js";
import { Vector } from "../utils/Vector";
import Controls from "../Controls";
import IUpdate from "./IUpdate";

const speed = 150;

export default class Bullet extends Sprite implements IUpdate {
    velocity: Vector;
    owner: string;
    id: number;

    constructor(position: Vector, velocity: Vector, angle: number, owner: string, id: number, imageURL: string) {
        super(Texture.from(imageURL));
        this.position = position;
        this.velocity = velocity;
        this.angle = angle + 90;
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.owner = owner;
        this.id = id;
    }

    update(dt: number) {
        this.x = this.x + this.velocity.x * dt / 1000;
        this.y = this.y + this.velocity.y * dt / 1000;
    }
}