export class Vector {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    get normalized(): Vector {
        const len = this.length;
        return new Vector(this.x / len, this.y / len);
    }
    static distance(a: Vector, b: Vector): number {
        return new Vector(b.x - a.x, b.y - a.y).length;
    }
}
