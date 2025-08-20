export type IDestroyable = { __destroy: (recursive?: boolean) => void }

const initMemoryHandler = () => {
    let numCreatedObjects = 0

    const debugObjects: { [x: string]: number } = {}
    const cachedObjects: any[] = []

    const purgeObject = (obj: any | any[], recursive?: boolean) => {
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

    const destroyObject = (self: any, recursive = false) => {
        if (!self.__destroy) {
            print(info().GetStackTrace())
            throw 'Object is not memory handled'
        }

        purgeObject(self, recursive)
        cachedObjects.push(self)
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

    const defaultObjectMeta = getObjectMeta()

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

    const getEmptyClass = <T extends new (...args: any) => any>(
        classInstance: T,
        ..._params: ConstructorParameters<T>
    ) => {
        let params = _params as unknown[] // We cast params to array so that TSTL adds a +1 since arrays are 1-indexed
        let debugName: string | undefined = undefined

        if (typeof classInstance === 'string') {
            debugName = classInstance
            classInstance = params[0] as T
            params = params.slice(1)
        }

        const obj = getEmptyObject<InstanceType<T>>(debugName)

        // local function __TS__Class(self)
        //     local c = {prototype = {}}
        //     c.prototype.__index = c.prototype
        //     c.prototype.constructor = c
        //     return c
        // end

        // local function __TS__New(target, ...)
        //     local instance = setmetatable({}, target.prototype)
        //     instance:____constructor(...)
        //     return instance
        // end

        // MIGHT NEED IN FUTURE
        // obj.__index = classInstance.prototype

        // MIGHT NEED IN FUTURE; basically do new classInstance above somewhere and cache one per name
        // for (const [k, v] of pairs(classCache[classInstance.name])) {
        //     if (typeof k !== 'string') continue
        //     if (k.startsWith('_')) continue
        //     obj[k] = v
        // }

        classInstance.prototype.____constructor?.(obj, ...params)

        return obj
    }

    const getEmptyObject = <T>(debugName?: string) => {
        let obj: T & IDestroyable = cachedObjects.shift()

        if (!!obj) {
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
    }

    return {
        getEmptyClass,
        getEmptyObject,
        getEmptyArray: <T>(debugName?: string) => {
            return getEmptyObject<T[]>(debugName) as T[] & IDestroyable
        },
        destroyObject,
        destroyArray: destroyObject,
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

            printDebugNames('objects', debugObjects)

            if ((_G as any)['trackPrintMap']) {
                printDebugNames('globals', (_G as any)['__fakePrintMap'])
            }
        },
    }
}

export const MemoryHandler = initMemoryHandler()
