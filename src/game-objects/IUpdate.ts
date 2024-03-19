export default interface IUpdatable {
    update(dt: number): void;
}

export const isIUpdatable = (object: any): object is IUpdatable => {
    return (object as IUpdatable).update !== undefined;
}
