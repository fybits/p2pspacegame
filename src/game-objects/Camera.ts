import { Container, Texture } from "pixi.js";
import { Vector } from "../utils/Vector";
import Controls from "../Controls";
import IUpdate from "./IUpdate";


export default class Camera extends Container implements IUpdate {
    private zoom: number;
    public desiredZoom: number;
    public desiredPosition: Vector;


    constructor() {
        super();
        this.desiredPosition = new Vector(0, 0);
        this.zoom = 1;
        this.desiredZoom = 1;
    }

    screenToWorldPoint(screenPosition: Vector) {
        return new Vector((-this.position.x + screenPosition.x) / this.zoom, (-this.position.y + screenPosition.y) / this.zoom);
    }

    update(dt: number) {
        const dZoom = this.desiredZoom - this.zoom;
        this.zoom = + this.zoom + dZoom * dt / 15
        this.scale.x = this.zoom;
        this.scale.y = this.zoom;
        const dPos = { x: this.desiredPosition.x - this.position.x, y: this.desiredPosition.y - this.position.y };
        this.position.x = this.position.x + dPos.x * dt / 15;
        this.position.y = this.position.y + dPos.y * dt / 15;
    }
}