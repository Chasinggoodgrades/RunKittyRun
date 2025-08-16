import { execSync } from 'child_process'
import { writeFileSync } from 'fs'
import * as fs from 'fs-extra'
import { EOL } from 'os'
import * as path from 'path'
import { createLogger, format, transports } from 'winston'
const { combine, timestamp, printf } = format
const luamin = require('luamin')

export interface IProjectConfig {
    mapFolder: string
    minifyScript: boolean
    gameExecutable: string
    outputFolder: string
    launchArgs: string[]
    winePath?: string
    winePrefix?: string
}

/**
 * Load an object from a JSON file.
 * @param fname The JSON file
 */
export function loadJsonFile(fname: string) {
    try {
        return JSON.parse(fs.readFileSync(fname).toString())
    } catch (e: any) {
        logger.error(e.toString())
        return {}
    }
}

/**
 * Convert a Buffer to ArrayBuffer
 * @param buf
 */
export function toArrayBuffer(b: Buffer): ArrayBuffer {
    var ab = new ArrayBuffer(b.length)
    var view = new Uint8Array(ab)
    for (var i = 0; i < b.length; ++i) {
        view[i] = b[i]
    }
    return ab
}

/**
 * Convert a ArrayBuffer to Buffer
 * @param ab
 */
export function toBuffer(ab: ArrayBuffer) {
    var buf = Buffer.alloc(ab.byteLength)
    var view = new Uint8Array(ab)
    for (var i = 0; i < buf.length; ++i) {
        buf[i] = view[i]
    }
    return buf
}

/**
 * Recursively retrieve a list of files in a directory.
 * @param dir The path of the directory
 */
export function getFilesInDirectory(dir: string) {
    const files: string[] = []
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file)
        if (fs.lstatSync(fullPath).isDirectory()) {
            const d = getFilesInDirectory(fullPath)
            for (const n of d) {
                files.push(n)
            }
        } else {
            files.push(fullPath)
        }
    })
    return files
}

function updateTSConfig(mapFolder: string) {
    const tsconfig = loadJsonFile('tsconfig.json')
    const plugin = tsconfig.compilerOptions.plugins[0]

    plugin.mapDir = path.resolve('maps', mapFolder).replace(/\\/g, '/')
    plugin.entryFile = path.resolve(tsconfig.tstl.luaBundleEntry).replace(/\\/g, '/')
    plugin.outputDir = path.resolve('dist', mapFolder).replace(/\\/g, '/')

    writeFileSync('tsconfig.json', JSON.stringify(tsconfig, undefined, 4))
}

/**
 *
 */
export function compileMap(config: IProjectConfig) {
    if (!config.mapFolder) {
        logger.error(`Could not find key "mapFolder" in config.json`)
        return false
    }

    const tsLua = './dist/tstl_output.lua'

    if (fs.existsSync(tsLua)) {
        fs.unlinkSync(tsLua)
    }

    logger.info(`Building "${config.mapFolder}"...`)
    fs.copySync(`./maps/${config.mapFolder}`, `./dist/${config.mapFolder}`)

    logger.info('Modifying tsconfig.json to work with war3-transformer...')
    updateTSConfig(config.mapFolder)

    logger.info('Transpiling TypeScript to Lua...')
    execSync('tstl -p tsconfig.json', { stdio: 'inherit' })

    if (!fs.existsSync(tsLua)) {
        logger.error(`Could not find "${tsLua}"`)
        return false
    }

    // Merge the TSTL output with war3map.lua
    const mapLua = `./dist/${config.mapFolder}/war3map.lua`

    if (!fs.existsSync(mapLua)) {
        logger.error(`Could not find "${mapLua}"`)
        return false
    }

    try {
        let contents =
            fs
                .readdirSync('./src/lualibs')
                .filter(s => s.endsWith('.lua'))
                .map(s =>
                    [
                        `${s.replace('.lua', '')} = function()`,
                        fs
                            .readFileSync(`./src/lualibs/${s}`)
                            .toString()
                            .replace(new RegExp('(^function.*?\\()', 'gm'), '$1dis, '),
                        'end',
                        EOL,
                    ].join(EOL)
                )
                .join(EOL) +
            fs.readFileSync(mapLua).toString() +
            fs.readFileSync(tsLua).toString()

        const luaPatches: { title: string; from: string; to: string }[] = [
            {
                title: 'Replace require functionality to support circular dependency detection',
                from: `local ____modules = {}
local ____moduleCache = {}
local ____originalRequire = require
local function require(file, ...)
    if ____moduleCache[file] then
        return ____moduleCache[file].value
    end
    if ____modules[file] then
        local module = ____modules[file]
        local value = nil
        if (select("#", ...) > 0) then value = module(...) else value = module(file) end
        ____moduleCache[file] = { value = value }
        return value
    else
        if ____originalRequire then
            return ____originalRequire(file)
        else
            error("module '" .. file .. "' not found")
        end
    end
end`,
                to: `local ____modules = {}
local ____moduleCache = {}
local ____originalRequire = require

local function require(file, ...)
    -- Return cached value if present
    local cached = ____moduleCache[file]
    if cached then
        return cached.value
    end

    -- Our module table?
    local moduleFactory = ____modules[file]
    if moduleFactory then
        -- Pre-populate cache with a placeholder to allow circular deps
        local placeholder = {}
        ____moduleCache[file] = { value = placeholder, initializing = true }

        -- Run the module factory
        local value
        if select("#", ...) > 0 then
            value = moduleFactory(...)
        else
            value = moduleFactory(file)
        end

        -- If the module returned a table, copy fields into the placeholder
        if type(value) == "table" then
            for k, v in pairs(value) do
                placeholder[k] = v
            end
            ____moduleCache[file].value = placeholder
        else
            -- For non-tables (numbers/strings/functions), just overwrite
            ____moduleCache[file].value = value
        end

        ____moduleCache[file].initializing = false
        return ____moduleCache[file].value
    end

    -- Fall back to the host's require
    if ____originalRequire then
        return ____originalRequire(file)
    else
        error("module '" .. file .. "' not found")
    end
end`,
            },
            {
                title: '__TS__ArraySplice',
                from: `local function __TS__ArraySplice(self, ...)
    local args = {...}
    local len = #self
    local actualArgumentCount = __TS__CountVarargs(...)
    local start = args[1]
    local deleteCount = args[2]
    if start < 0 then
        start = len + start
        if start < 0 then
            start = 0
        end
    elseif start > len then
        start = len
    end
    local itemCount = actualArgumentCount - 2
    if itemCount < 0 then
        itemCount = 0
    end
    local actualDeleteCount
    if actualArgumentCount == 0 then
        actualDeleteCount = 0
    elseif actualArgumentCount == 1 then
        actualDeleteCount = len - start
    else
        actualDeleteCount = deleteCount or 0
        if actualDeleteCount < 0 then
            actualDeleteCount = 0
        end
        if actualDeleteCount > len - start then
            actualDeleteCount = len - start
        end
    end
    local out = {}
    for k = 1, actualDeleteCount do
        local from = start + k
        if self[from] ~= nil then
            out[k] = self[from]
        end
    end
    if itemCount < actualDeleteCount then
        for k = start + 1, len - actualDeleteCount do
            local from = k + actualDeleteCount
            local to = k + itemCount
            if self[from] then
                self[to] = self[from]
            else
                self[to] = nil
            end
        end
        for k = len - actualDeleteCount + itemCount + 1, len do
            self[k] = nil
        end
    elseif itemCount > actualDeleteCount then
        for k = len - actualDeleteCount, start + 1, -1 do
            local from = k + actualDeleteCount
            local to = k + itemCount
            if self[from] then
                self[to] = self[from]
            else
                self[to] = nil
            end
        end
    end
    local j = start + 1
    for i = 3, actualArgumentCount do
        self[j] = args[i]
        j = j + 1
    end
    for k = #self, len - actualDeleteCount + itemCount + 1, -1 do
        self[k] = nil
    end
    return out
end`,
                to: `local function __TS__ArraySplice(self, start, deleteCount)
    local len = #self
    local actualArgumentCount = 2

    if start < 0 then
        start = len + start
        if start < 0 then
            start = 0
        end
    elseif start > len then
        start = len
    end

    local itemCount = actualArgumentCount - 2
    if itemCount < 0 then
        itemCount = 0
    end

    local actualDeleteCount
    if actualArgumentCount == 0 then
        actualDeleteCount = 0
    elseif actualArgumentCount == 1 then
        actualDeleteCount = len - start
    else
        actualDeleteCount = deleteCount or 0
        if actualDeleteCount < 0 then
            actualDeleteCount = 0
        end
        if actualDeleteCount > len - start then
            actualDeleteCount = len - start
        end
    end

    if itemCount < actualDeleteCount then
        for k = start + 1, len - actualDeleteCount do
            local from = k + actualDeleteCount
            local to = k + itemCount
            if self[from] then
                self[to] = self[from]
            else
                self[to] = nil
            end
        end
        for k = len - actualDeleteCount + itemCount + 1, len do
            self[k] = nil
        end
    elseif itemCount > actualDeleteCount then
        for k = len - actualDeleteCount, start + 1, -1 do
            local from = k + actualDeleteCount
            local to = k + itemCount
            if self[from] then
                self[to] = self[from]
            else
                self[to] = nil
            end
        end
    end

    for k = #self, len - actualDeleteCount + itemCount + 1, -1 do
        self[k] = nil
    end
end`,
            },
            {
                title: '__TS__ObjectGetOwnPropertyDescriptors',
                from: `local function __TS__ObjectGetOwnPropertyDescriptors(object)
    local metatable = getmetatable(object)
    if not metatable then
        return {}
    end
    return rawget(metatable, "_descriptors") or ({})
end`,
                to: `local __MEM__EmptyObject = {}
local function __TS__ObjectGetOwnPropertyDescriptors(object)
    local metatable = getmetatable(object)
    if not metatable then
        return __MEM__EmptyObject
    end
    return rawget(metatable, "_descriptors") or (__MEM__EmptyObject)
end`,
            },
        ]

        for (const luaPatch of luaPatches) {
            if (contents.indexOf(luaPatch.from) === -1) {
                console.warn(`Failed to apply lua patch: ${luaPatch.title}`)
            } else {
                contents = contents.replace(luaPatch.from, luaPatch.to)
            }
        }

        if (config.minifyScript) {
            logger.info(`Minifying script...`)
            contents = luamin.minify(contents.toString())
        }

        fs.writeFileSync(mapLua, contents)
    } catch (err: any) {
        logger.error(err.toString())
        return false
    }

    return true
}

/**
 * Formatter for log messages.
 */
const loggerFormatFunc = printf(({ level, message, timestamp }) => {
    return `[${timestamp.replace('T', ' ').split('.')[0]}] ${level}: ${message}`
})

/**
 * The logger object.
 */
export const logger = createLogger({
    transports: [
        new transports.Console({
            format: combine(format.colorize(), timestamp(), loggerFormatFunc),
        }),
        new transports.File({
            filename: 'project.log',
            format: combine(timestamp(), loggerFormatFunc),
        }),
    ],
})
