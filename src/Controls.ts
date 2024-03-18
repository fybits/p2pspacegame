import { Vector } from "./utils/Vector";

export enum KeyState {
    OFF = 0,
    HELD = 1,
    PRESSED = 2,
}

export default class Controls {
    public keyboard: Map<string, number>;
    public mouse: { position: Vector, pressed: boolean };

    private static _instance: Controls
    static get instance() {
        if (Controls._instance) {
            return Controls._instance;
        }
        throw new Error("Controls is not created!");
    }


    private keyDown(event: KeyboardEvent) {
        Controls.instance.keyboard.set(event.key.toLowerCase(), KeyState.HELD);
        event.preventDefault();
    }

    private keyUp(event: KeyboardEvent) {
        Controls.instance.keyboard.set(event.key.toLowerCase(), KeyState.PRESSED);
        event.preventDefault();
        requestAnimationFrame(() => Controls.instance.keyboard.set(event.key.toLowerCase(), KeyState.OFF))
    }

    private mouseMove(event) {
        Controls.instance.mouse.position = new Vector(event.offsetX, event.offsetY);
    }

    private mouseDown(event: MouseEvent) {
        if (event.button === 0) {
            Controls.instance.mouse.pressed = true;
        }
    }

    private mouseUp(event: MouseEvent) {
        if (event.button === 0) {
            Controls.instance.mouse.pressed = false;
        }
    }


    constructor(parent: HTMLElement) {
        this.keyboard = new Map();
        this.mouse = { position: new Vector(0, 0), pressed: false };
        parent.addEventListener("keydown", (e) => this.keyDown(e));
        parent.addEventListener("keyup", this.keyUp);
        parent.addEventListener("mousemove", this.mouseMove);
        parent.addEventListener("mousedown", this.mouseDown);
        parent.addEventListener("mouseup", this.mouseUp);
        Controls._instance = this;
    }
}