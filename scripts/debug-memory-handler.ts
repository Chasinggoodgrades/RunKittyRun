import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const targetFile = process.argv[2] || resolve('./dist/map.w3x/war3map.lua')

const objPrefix = "info():GetStackTrace() .. ' > ' .. "

let contentsRaw = readFileSync(targetFile).toString()
const lines = contentsRaw.split('\n')
let counter = 0

// Keep first x lines unchanged, they contain the info() object.. would cause issues if modified
const TOUCH_AFTER = 22
const unchangedLines = lines.slice(0, TOUCH_AFTER)
let contents = lines.slice(TOUCH_AFTER).join('\n')

contents = contents.replace(new RegExp('MemoryHandler.getEmptyClass\\((.*?)\\)', 'gmi'), (_, m1) => {
    return `MemoryHandler.getEmptyClass(${objPrefix}'obj.${counter++}', ${m1})`
})

contents = contents.replace(new RegExp('MemoryHandler.getEmptyObject\\(\\)', 'gmi'), () => {
    return `MemoryHandler.getEmptyObject(${objPrefix}'obj.${counter++}')`
})

contents = contents.replace(new RegExp('MemoryHandler.getEmptyArray\\(\\)', 'gmi'), () => {
    return `MemoryHandler.getEmptyArray(${objPrefix}'arr.${counter++}')`
})

// Print all native wc3 functions that return game objects
{
    const nativeFunctions = [
        {
            name: 'MultiboardItem',
            leaks: ['MultiboardGetItem'],
            plugs: ['MultiboardReleaseItem'],
        },
        {
            name: 'Item',
            leaks: ['CreateItem', 'BlzCreateItemWithSkin'],
            plugs: ['RemoveItem'],
        },
    ]

    for (const nativeFunction of nativeFunctions) {
        for (const leak of nativeFunction.leaks) {
            contents = contents.replace(new RegExp(`^.*?\\b${leak}\\b`, 'gmi'), _ => {
                return `__fakePrint('Native ${nativeFunction.name}')\n${_}`
            })
        }

        for (const plug of nativeFunction.plugs) {
            contents = contents.replace(new RegExp(`^.*?\\b${plug}\\b`, 'gmi'), _ => {
                return `__fakePrint('Native ${nativeFunction.name}', -1)\n${_}`
            })
        }
    }
}

// Print all created objects and functions
{
    contents = contents.replace(new RegExp('(=|return|,|\\()\\s*{', 'gmi'), (_, a) => {
        return `${a} __fakePrint(${objPrefix}'Object #${counter++}') or {`
    })

    contents = contents.replace(new RegExp('(=|return|,|\\()\\s*function\\(', 'gmi'), (_, a) => {
        return `${a} __fakePrint(${objPrefix}'Function #${counter++}') or function(`
    })

    contents = contents.replace(new RegExp('local function', 'gmi'), () => {
        return `__fakePrint(${objPrefix}'Function #${counter++}')\nlocal function`
    })

    const fakePrint = `local __fakePrintMap = {}
_G['__fakePrintMap'] = __fakePrintMap

function __fakePrint(s, n)
    n = n or 1

    if _G['trackPrintMap'] then
        if (not __fakePrintMap[s]) then
            __fakePrintMap[s] = 0
        end

        __fakePrintMap[s] = __fakePrintMap[s] + n
    end

    if _G['printCreation'] then
        print(s)
    end
end`

    contents = fakePrint + '\n\n' + contents
}

// Combine unchanged lines with processed content
contentsRaw = unchangedLines.join('\n') + '\n' + contents

writeFileSync(targetFile, contentsRaw)

console.log('OK')
