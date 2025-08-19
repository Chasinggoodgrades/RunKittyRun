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

function createTemporaryTSConfig(mapFolder: string) {
    const tsconfig = loadJsonFile('tsconfig.json')

    // Create a copy and modify the plugin settings
    const tempConfig = JSON.parse(JSON.stringify(tsconfig))
    const tempPlugin = tempConfig.compilerOptions.plugins[0]

    tempPlugin.mapDir = path.resolve('maps', mapFolder).replace(/\\/g, '/')
    tempPlugin.entryFile = path.resolve(tsconfig.tstl.luaBundleEntry).replace(/\\/g, '/')
    tempPlugin.outputDir = path.resolve('dist', mapFolder).replace(/\\/g, '/')

    const tempConfigPath = 'tsconfig.build.json'
    writeFileSync(tempConfigPath, JSON.stringify(tempConfig, undefined, 4))

    return tempConfigPath
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

    logger.info('Creating temporary tsconfig.json for war3-transformer...')
    const tempConfigPath = createTemporaryTSConfig(config.mapFolder)

    try {
        logger.info('Transpiling TypeScript to Lua...')
        execSync(`tstl -p ${tempConfigPath}`, { stdio: 'inherit' })
    } finally {
        // Clean up the temporary config file
        if (fs.existsSync(tempConfigPath)) {
            fs.unlinkSync(tempConfigPath)
        }
    }

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
                to: `-- bundler tables you already have (keep them)
local ____modules = ____modules or {}
local ____moduleCache = ____moduleCache or {}

-- capture original require before overriding
local ____originalRequire = ____originalRequire or require

-- helpers
local function __starts_with_src(file)
    return type(file) == "string" and file:sub(1,4) == "src." and file ~= "src.main"
end

-- no-op iterator for non-table fields
local function __nopairs()
    return function() return nil end
end

-- Create a loader that resolves and caches the real module value
local function __make_loader(file, argv, cacheEntry)
    return function()
        -- if we've already resolved, return it
        if cacheEntry.value and not cacheEntry.__is_proxy then
            return cacheEntry.value
        end

        local value
        if ____modules[file] then
            local moduleFactory = ____modules[file]
            if #argv > 0 then
                value = moduleFactory(table.unpack(argv))
            else
                value = moduleFactory(file)
            end
        else
            if ____originalRequire then
                -- pass through varargs to original require in case the host uses them
                value = ____originalRequire(file, table.unpack(argv))
            else
                error("module '" .. file .. "' not found")
            end
        end

        -- replace proxy with the real thing in cache
        cacheEntry.value = value
        cacheEntry.__is_proxy = false
        return value
    end
end

-- Create a proxy for a specific field of a (not-yet-loaded) module
local function __make_field_proxy(file, key, resolve_module)
    local fp -- forward declare for self reference
    fp = setmetatable({
        __lazy_proxy = true, __kind = "field", __file = file, __key = key
    }, {
        -- Calling the field: lazy-load module, then call if it's a function; else return the value
        __call = function(_, ...)
            local real = resolve_module()
            local target = real[key]
            -- If the target is already a proxy, just forward the call or return it
            if type(target) == "table" and target.__lazy_proxy then
                local mt = getmetatable(target)
                if mt and mt.__call then
                    return mt.__call(target, ...)
                end
                return target
            end
            if type(target) == "function" then
                return target(...)
            else
                -- not a function; return the actual value (first touch resolves)
                return target
            end
        end,
        -- Treating the field as a table: resolve and forward
        __index = function(_, subkey)
            local real = resolve_module()
            local target = real[key]
            if type(target) == "table" and target.__lazy_proxy then
                return target[subkey] -- already a proxy, return it untouched
            end
            if type(target) == "table" then
                return target[subkey]
            end
            return nil
        end,
        __newindex = function(_, subkey, v)
            local real = resolve_module()
            local target = real[key]
            if type(target) ~= "table" then
                error(("attempt to index non-table field '%s' of module '%s'"):format(tostring(key), tostring(file)))
            end
            target[subkey] = v
        end,
        __pairs = function(_)
            local real = resolve_module()
            local target = real[key]
            if type(target) == "table" then
                return pairs(target)
            end
            return __nopairs()
        end,
        __len = function(_)
            local real = resolve_module()
            local target = real[key]
            return (type(target) == "table" or type(target) == "string") and #target or 0
        end,
        __tostring = function(_)
            return ("ProxyField(%s.%s)"):format(tostring(file), tostring(key))
        end,
    })
    return fp
end

-- Create the top-level module proxy
local function __make_module_proxy(file, loader, cacheEntry)
    local proxy -- forward decl
    local function resolve_module()
        return loader()
    end

    proxy = setmetatable({
        __lazy_proxy = true, __kind = "module", __file = file
    }, {
        -- Accessing a field (2nd level)
        __index = function(_, key)
            -- if already resolved, return real field (and respect existing proxies)
            if cacheEntry.value and not cacheEntry.__is_proxy then
                local v = cacheEntry.value[key]
                if type(v) == "table" and v.__lazy_proxy then
                    return v -- already a proxy, return as-is
                end
                -- For functions we could return them directly, but to keep "2nd level lazy for functions"
                -- we wrap only when it's a function; otherwise return actual value.
                if type(v) == "function" then
                    -- wrap a callable that just forwards without re-resolving cost
                    return function(...)
                        return cacheEntry.value[key](...)
                    end
                end
                return v
            end
            -- Not resolved yet:
            -- Return a field proxy that will only resolve when called (function path)
            -- or when treated like a table (index/iterate).
            return __make_field_proxy(file, key, resolve_module)
        end,
        -- Writing into module table forces resolution
        __newindex = function(_, key, v)
            local real = resolve_module()
            real[key] = v
        end,
        -- Calling the module directly (if it exports a function)
        __call = function(_, ...)
            local real = resolve_module()
            if type(real) ~= "function" then
                error(("attempt to call non-function module '%s'"):format(tostring(file)))
            end
            return real(...)
        end,
        __pairs = function(_)
            local real = resolve_module()
            return pairs(real)
        end,
        __len = function(_)
            local real = resolve_module()
            return (type(real) == "table" or type(real) == "string") and #real or 0
        end,
        __tostring = function(_)
            return ("ProxyModule(%s)"):format(tostring(file))
        end,
    })

    return proxy
end

-- The overridden require
local function require(file, ...)
    -- Honor existing cache first (already-resolved or existing proxy)
    if ____moduleCache[file] and ____moduleCache[file].value then
        return ____moduleCache[file].value
    end

    -- Only lazy-wrap "src.*" (except "src.main")
    if __starts_with_src(file) then
        local argv = { ... }

        -- Create a cache entry up front with a placeholder proxy marker
        local cacheEntry = { value = nil, __is_proxy = true }

        local loader = __make_loader(file, argv, cacheEntry)
        local proxy = __make_module_proxy(file, loader, cacheEntry)

        -- Put the proxy in cache immediately so repeated requires return same proxy
        cacheEntry.value = proxy
        ____moduleCache[file] = cacheEntry

        return proxy
    end

    -- For non-src.* or src.main, fall back to your bundler/original logic
    if ____modules[file] then
        local moduleFactory = ____modules[file]
        local value
        if (select("#", ...) > 0) then
            value = moduleFactory(...)
        else
            value = moduleFactory(file)
        end
        ____moduleCache[file] = { value = value }
        return value
    end

    if ____originalRequire then
        local value = ____originalRequire(file, ...)
        ____moduleCache[file] = { value = value }
        return value
    end

    error("module '" .. file .. "' not found")
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
