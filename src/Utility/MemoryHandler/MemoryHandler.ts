export type IDestroyable = { __destroy: (recursive?: boolean) => void }

const initMemoryHandler = () => {
    let numCreatedObjects = 0
    let numCreatedArrays = 0

    const debugObjects: { [x: string]: number } = {}
    const debugArrays: { [x: string]: number } = {}

    const cachedObjects: any[] = []
    const cachedArrays: any[] = []

    const purgeObject = (obj: any, recursive?: boolean) => {
        for (const [k] of pairs(obj)) {
            recursive && typeof obj[k] === 'object' && obj[k].__destroy?.(obj[k], recursive)
            obj[k] = undefined
        }

        const meta = getmetatable(obj) as any

        if (meta.__debugName) {
            if (meta.__debugName && debugObjects[meta.__debugName]) {
                debugObjects[meta.__debugName]--

                if (debugObjects[meta.__debugName] === 0) {
                    ;(debugObjects[meta.__debugName] as any) = undefined
                }
            }

            meta.__debugName = undefined
            meta.__destroyed = true
        }
    }

    const purgeArray = (arr: any[], recursive?: boolean) => {
        for (const [k] of pairs(arr)) {
            recursive && typeof arr[k] === 'object' && arr[k].__destroy?.(arr[k], recursive)
            ;(arr as any)[k] = undefined
        }

        const meta = getmetatable(arr) as any

        if (meta.__debugName) {
            if (meta.__debugName && debugArrays[meta.__debugName]) {
                debugArrays[meta.__debugName]--

                if (debugArrays[meta.__debugName] === 0) {
                    ;(debugArrays[meta.__debugName] as any) = undefined
                }
            }

            meta.__debugName = undefined
            meta.__destroyed = true
        }
    }

    const destroyObject = (self: any, recursive = false) => {
        purgeObject(self, recursive)
        cachedObjects.push(self)
    }

    const destroyArray = (self: any[], recursive = false) => {
        purgeArray(self, recursive)
        cachedArrays.push(self)
    }

    const getObjectMeta = (debugName?: string) => {
        const meta: any = {
            __gc: (self: any) => {
                purgeObject(self)
            },
            __newindex: (self: any, k: any, v: any) => {
                if (meta.__destroyed) {
                    print(info().GetStackTrace())
                    throw 'Writing a destroyed object'
                }

                rawset(self, k, v)
            },
            __index: (_self: any, key: string) => {
                if (meta.__destroyed) {
                    print(info().GetStackTrace())
                    throw 'Reading a destroyed object'
                }

                if (key === '__destroy') {
                    return destroyObject
                }
            },
        }

        debugName && (meta['__debugName'] = debugName)

        return meta
    }

    const getArrayMeta = (debugName?: string) => {
        const meta: any = {
            __gc: (self: any[]) => {
                purgeArray(self)
            },
            __newindex: (self: any[], k: any, v: any) => {
                if (meta.__destroyed) {
                    print(info().GetStackTrace())
                    throw 'Writing a destroyed array'
                }

                rawset(self, k, v)
            },
            __index: (_self: any[], key: string) => {
                if (meta.__destroyed) {
                    print(info().GetStackTrace())
                    throw 'Reading a destroyed array'
                }

                if (key === '__destroy') {
                    return destroyArray
                }
            },
        }

        debugName && (meta['__debugName'] = debugName)

        return meta
    }

    const defaultObjectMeta = getObjectMeta()
    const defaultArrayMeta = getArrayMeta()

    type ITarget = { debugName: string | number; count: number }
    const targetCompare = (a: ITarget, b: ITarget) => b.count < a.count

    const printDebugNames = (title: string, targets: { [x: string]: number }) => {
        const sortedTargets = MemoryHandler.getEmptyArray<ITarget & IDestroyable>()

        for (const [debugName, count] of pairs(targets)) {
            const target = MemoryHandler.getEmptyObject<ITarget>()
            target.debugName = debugName
            target.count = count
            sortedTargets.push(target)
        }

        if (sortedTargets.length > 0) {
            table.sort(sortedTargets, targetCompare)

            let d = ''
            let i = 0

            for (const s of sortedTargets) {
                if (i++ < 10) {
                    d += (d.length > 0 ? ', ' : '') + `${s.debugName}: ${s.count}`
                }
            }

            print(`Most used ${title}: ${d}`)
        }

        sortedTargets.__destroy(true)
    }

    return {
        getEmptyObject: <T>(debugName?: string) => {
            let obj: T & IDestroyable = cachedObjects.shift()

            if (obj) {
                // Causes bugs if debugName changes where getEmptyObject gets called
                if (debugName) {
                    ;(getmetatable(obj) as any).__debugName = debugName
                    ;(getmetatable(obj) as any).__destroyed = false
                }
            } else {
                obj = {} as any
                numCreatedObjects++
                setmetatable(obj, debugName ? getObjectMeta(debugName) : defaultObjectMeta)
            }

            if (debugName) {
                if (!debugObjects[debugName]) {
                    debugObjects[debugName] = 0
                }

                debugObjects[debugName]++
            }

            return obj
        },
        getEmptyArray: <T>(debugName?: string) => {
            let arr: T[] & IDestroyable = cachedArrays.shift()

            if (arr) {
                // Causes bugs if debugName changes where getEmptyArray gets called
                if (debugName) {
                    ;(getmetatable(arr) as any).__debugName = debugName
                    ;(getmetatable(arr) as any).__destroyed = false
                }
            } else {
                arr = [] as any
                numCreatedArrays++
                setmetatable(arr, debugName ? getArrayMeta(debugName) : defaultArrayMeta)
            }

            if (debugName) {
                if (!debugArrays[debugName]) {
                    debugArrays[debugName] = 0
                }

                debugArrays[debugName]++
            }

            return arr
        },
        destroyObject,
        destroyArray,
        cloneArray: <T>(arr: T[]) => {
            const newArray = MemoryHandler.getEmptyArray<T>()

            for (let i = 0; i < arr.length; i++) {
                newArray[i] = arr[i]
            }

            return newArray
        },
        printDebugInfo: () => {
            print('MemoryHandler')
            print(`Objects: ${numCreatedObjects - cachedObjects.length}/${numCreatedObjects}`)
            print(`Arrays: ${numCreatedArrays - cachedArrays.length}/${numCreatedArrays}`)

            printDebugNames('objects', debugObjects)
            printDebugNames('arrays', debugArrays)

            if ((_G as any)['trackPrintMap']) {
                printDebugNames('globals', (_G as any)['__fakePrintMap'])
            }
        },
    }
}

export const MemoryHandler = initMemoryHandler()
