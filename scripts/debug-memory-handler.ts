import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const targetFile = process.argv[2] || resolve('./dist/map.w3x/war3map.lua')

const objPrefix = '' //"info():GetStackTrace() .. ' > ' .. "

let contents = readFileSync(targetFile).toString()
let counter = 0

contents = contents.replace(new RegExp('MemoryHandler.getEmptyObject\\(\\)', 'gmi'), () => {
    return `MemoryHandler.getEmptyObject(${objPrefix}'obj.${counter++}')`
})

contents = contents.replace(new RegExp('MemoryHandler.getEmptyArray\\(\\)', 'gmi'), () => {
    return `MemoryHandler.getEmptyArray('arr.${counter++}')`
})

// Print all created objects and functions
{
    contents = contents.replace(new RegExp('(=|return|,)\\s+{', 'gmi'), (_, a) => {
        return `${a} __fakePrint('Object #${counter++}') or {`
    })

    contents = contents.replace(new RegExp('\\({', 'gmi'), () => {
        return `(__fakePrint('Object #${counter++}') or {`
    })

    contents = contents.replace(new RegExp('(=|return|,)\\s+function\\(', 'gmi'), (_, a) => {
        return `${a} __fakePrint('Function #${counter++}') or function(`
    })

    contents = contents.replace(new RegExp('local function', 'gmi'), () => {
        return `__fakePrint('Function #${counter++}')\nlocal function`
    })

    const fakePrint = `local __fakePrintMap = {}
_G['__fakePrintMap'] = __fakePrintMap

function __fakePrint(s)
    if _G['trackPrintMap'] then
        if (not __fakePrintMap[s]) then
            __fakePrintMap[s] = 0
        end

        __fakePrintMap[s] = __fakePrintMap[s] + 1
    end

    if _G['printCreation'] then
        print(s)
    end
end`

    contents = fakePrint + '\n\n' + contents
}

writeFileSync(targetFile, contents)

console.log('OK')
