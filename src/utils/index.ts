
export const sortedClamp = (value: number, a: number, b: number): number => {
    if (a > b) {
        return Math.min(Math.max(value, b), a)
    }
    return Math.min(Math.max(value, a), b)
};


