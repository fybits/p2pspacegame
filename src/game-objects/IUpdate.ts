export default interface IUpdate {
    update(dt: number): void;
}

export const isIUpdate = (object): object is IUpdate => {
    return (object as IUpdate).update !== undefined;
}
