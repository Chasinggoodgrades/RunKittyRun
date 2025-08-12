export const safeArraySplice = <T>(items: T[], cb: (item: T) => boolean) => {
    let index: number

    while ((index = items.findIndex(item => cb(item))) >= 0) {
        items.splice(index, 1)
    }
}

export const literalArray = <T extends string>(t: T[]): T[] => t
