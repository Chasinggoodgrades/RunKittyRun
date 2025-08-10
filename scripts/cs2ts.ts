#!/usr/bin/env ts-node

/**
 * cs2ts-simple.ts
 * Minimal C# → TypeScript converter scaffold.
 * - Only handles input/output + recursive file collection.
 * - Applies *string-only* replacements (no regex).
 * - Writes sibling .ts files.
 *
 * Extend the REPLACERS array below with your own .replaceAll() style swaps.
 */

import { execSync } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'

async function runPrettierOnConvertedFiles(convertedTsFiles: string[]) {
    console.log('\nRunning prettier on converted TypeScript files...')

    if (convertedTsFiles.length === 0) {
        console.log('No TypeScript files to format.')
        return
    }

    let successCount = 0
    let errorCount = 0

    for (const file of convertedTsFiles) {
        try {
            execSync(`npx prettier --write "${file}"`, { stdio: 'pipe' })
            console.log(`✅ Formatted: ${path.relative(process.cwd(), file)}`)
            successCount++
        } catch (error) {
            console.error(`❌ Failed to format ${path.relative(process.cwd(), file)}: ${error}`)
            errorCount++
        }
    }

    console.log(`\nPrettier formatting complete:`)
    console.log(`✅ Successfully formatted: ${successCount} files`)
    console.log(`❌ Failed to format: ${errorCount} files`)
    console.log(`📊 Total files processed: ${convertedTsFiles.length}`)
}

async function main() {
    const input = process.argv[2]
    if (!input) {
        console.error('Usage: ts-node ./scripts/cs2ts-simple.ts <FILE_OR_DIR>')
        process.exit(1)
    }

    const abs = path.resolve(input)
    const st = await fs.stat(abs).catch(() => null)
    if (!st) {
        console.error(`Not found: ${abs}`)
        process.exit(1)
    }

    const files: string[] = []
    if (st.isDirectory()) {
        await collectCsFiles(abs, files)
    } else if (st.isFile() && abs.toLowerCase().endsWith('.cs')) {
        files.push(abs)
    } else {
        console.error('Input must be a .cs file or a directory containing .cs files.')
        process.exit(1)
    }

    if (files.length === 0) {
        console.log('No .cs files found.')
        return
    }

    const convertedTsFiles: string[] = []
    for (const f of files) {
        const tsFile = await processFile(f)
        convertedTsFiles.push(tsFile)
    }

    console.log(`Done. Converted ${files.length} file(s).`)

    // Run prettier on the converted TypeScript files
    await runPrettierOnConvertedFiles(convertedTsFiles)
}

async function collectCsFiles(dir: string, out: string[]) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const e of entries) {
        const p = path.join(dir, e.name)
        if (e.isDirectory()) {
            const low = e.name.toLowerCase()
            if (low === 'bin' || low === 'obj' || low === '.git') continue
            await collectCsFiles(p, out)
        } else if (e.isFile() && p.toLowerCase().endsWith('.cs')) {
            out.push(p)
        }
    }
}

async function processFile(filePath: string): Promise<string> {
    let src = await fs.readFile(filePath, 'utf8')

    // Remove leading BOM without regex
    if (src.length && src.charCodeAt(0) === 0xfeff) {
        src = src.slice(1)
    }

    const converted = transformBasic(src)
    const outPath = toTsOutPath(filePath)
    await fs.writeFile(outPath, converted, 'utf8')
    console.log(`→ ${path.relative(process.cwd(), outPath)}`)
    return outPath
}

function toTsOutPath(csPath: string) {
    const dir = path.dirname(csPath)
    const base = path.basename(csPath, '.cs')
    return path.join(dir, `${base}.ts`)
}

/* ---------------------------- CORE TRANSFORM ---------------------------- */

function transformBasic(input: string): string {
    let s = input

    s = s.replace(new RegExp('(^|\\s)void\\s+', 'g'), '$1')

    s = s.replace(new RegExp('(^|\\s|\\(|\\[|\\.)bool(\\s|$|\\[)', 'g'), '$1boolean$2')
    s = s.replace(new RegExp('(^|\\s|\\(|\\[|\\.)int(\\s|$|\\[)', 'g'), '$1number$2')
    s = s.replace(new RegExp('(^|\\s|\\(|\\[|\\.)float(\\s|$|\\[)', 'g'), '$1number$2')
    s = s.replace(new RegExp('(^|\\s|\\(|\\[|\\.)double(\\s|$|\\[)', 'g'), '$1number$2')

    // If line contains Predicate then comment it out
    s = s.replaceAll(new RegExp('(.*Predicate.*)', 'g'), '// TODO; Restore: $1')

    // If line contains `ref ` then remove ref and add comment add end
    s = s.replaceAll(new RegExp('((.*)ref( .*))', 'g'), '$2$3 // TODO; Cleanup: $1')

    // Remove casts
    s = s.replaceAll(new RegExp('\\((int|float|double|bool)\\)', 'g'), '')

    // Change `List<string>` to `string[]`  -- Can't do this, List is a custom object in C#
    // s = s.replaceAll(new RegExp('List<(.+?)>', 'g'), '$1[]')

    // Replace `{ "Speedster", "Unpredictable", "Fixation", "Frostbite", "Chaos", "Howler", "Blitzer", "Stealth", "Bomber" };` to `["Speedster", "Unpredictable", "Fixation", "Frostbite", "Chaos", "Howler", "Blitzer", "Stealth", "Bomber"]`
    s = s.replaceAll(new RegExp('{ (.+?) };', 'g'), '[$1]')

    s = s.replaceAll(new RegExp('{ (private )?get; (private )?set; } ?', 'g'), '')

    // Remove all imports
    s = s.replaceAll(new RegExp('using (.+);', 'g'), '')

    // Replace multi whiteline
    s = s.replaceAll(new RegExp('\\n\\s*\\n', 'g'), '\n\n')

    // Remove regions
    s = s.replaceAll(new RegExp('(#region .*)', 'g'), '// $1')
    s = s.replaceAll(new RegExp('(#endregion .*)', 'g'), '// $1')

    // Replace : base to  : super
    s = s.replaceAll(new RegExp(': base(.*?)', 'g'), '// TODO; CALL super$1')

    // Remove const
    s = s.replaceAll('const ', '')
    s = s.replaceAll('var ', 'let ')
    s = s.replaceAll('foreach ', 'for ')
    s = s.replaceAll('$"', '"')
    s = s.replaceAll(new RegExp('public ((static|abstract) )?class', 'g'), '$1class')
    // remove static class
    s = s.replaceAll(new RegExp('static class', 'g'), 'class')

    // Replace `class x : y` to `class x extends y`
    s = s.replaceAll(new RegExp('class (\\w+) : (\\w+)', 'g'), 'class $1 extends $2')

    // Replace `throw;`
    s = s.replaceAll(new RegExp('throw;', 'g'), 'throw new Error() // TODO; Rethrow actual error')
    s = s.replaceAll('Exception', 'Error')

    s = s.replaceAll('(System.Error)', '(System.Error e)')

    // Replace all floats to number, so 0.70f to 0.70
    s = s.replaceAll(new RegExp('(\\d+\\.\\d+)f', 'g'), '$1')
    // Also 3f to 3
    s = s.replaceAll(new RegExp('(\\d+)f', 'g'), '$1')

    // Replace `Globals.WolvesPerRound.TryGetValue(Globals.ROUND, out let wolvesInRound)` with `let wolvesInRound = Globals.WolvesPerRound.TryGetValue(Globals.ROUND)`;
    s = s.replaceAll(
        new RegExp('([a-z0-9_.]+?TryGetValue)\\((.+?), out (.*?) (.*?)\\)', 'gi'),
        '$4 = $1($2) /* TODO; Prepend: $3 */'
    )

    // If if contains `if (!.*TryGetValue.*))` then replace it to `if (!())`
    s = s.replaceAll(new RegExp('if \\(!(.*?TryGetValue.*?)\\)', 'g'), 'if (!($1))')

    // Replace one liner function `public IsAffixed(): boolean => Affixes.Count > 0` to `public IsAffixed(): boolean { return Affixes.Count > 0; }`
    s = s.replaceAll(
        new RegExp('\\bpublic (\\w+)\\(\\): (boolean|number|string) => (.+)', 'g'),
        'public $1(): $2 { return $3 }'
    )

    // Fix types
    const keywords = [
        'readonly',
        'public',
        'private',
        'protected',
        'static',
        'abstract',
        'async',
        'new',
        'let',
        'const',
        'in',
        'of',
        'class',
        'return',
        'extends',
        'override',
        'case',
        'switch',
        'break',
        'is',
        'ref',
        'namespace',
    ]

    // Replace `public boolean HasAffix(affixName: string)` to `public HasAffix(affixName: string): boolean`
    // s = s.replaceAll(
    //     /\bpublic\s+(?!override\b)(?:(?:readonly|public|private|protected|static|abstract|async|new|let|const|in|of|class|return|extends|override|case|switch|break|is|ref|namespace)\s+)*([A-Za-z0-9_<>\[\],.]+)\s+(\w+)\((.*?)\)/g,
    //     'public $2($3): $1'
    // )

    // Support multi parameters
    for (let i = 0; i < 10; i++) {
        // Fix types - first check for variable declarations
        s = s.replace(
            new RegExp(
                `^(?!\\s*(?:${keywords.join('\\b|')}\\b))(?!\\s*//)(\\s*(?:for\\s*\\()?)\\b(?!${keywords.join(
                    '\\b|'
                )}\\b)([A-Za-z0-9_]+)[ \\t]+(?!${keywords.join(
                    '\\b|'
                )}\\b)([A-Za-z0-9_]+)(?!\\w)(?!\\s*:)((?:(?!//).)*?)?(?:(//.*))?$`,
                'gm'
            ),
            '$1let $3: $2$4$5'
        )

        // Fix types - second check for class
        s = s.replace(
            new RegExp(
                `^((?:(?!//).)*?)\\b(?!${keywords.join('\\b|')}\\b)([A-Za-z0-9_]+)[ \\t]+(?!${keywords.join(
                    '\\b|'
                )}\\b)([A-Za-z0-9_]+(?:\\(\\))?)(?!\\w)((?:(?!//).)*)?(?:(//.*))?$`,
                'gm'
            ),
            '$1$3: $2$4$5'
        )
    }

    // Replace `ObjectPool<AchesTimers>.GetEmptyObject` to `ObjectPool.GetEmptyObject<AchesTimers>` but AchesTimers can be any T
    s = s.replaceAll(new RegExp('ObjectPool<([A-Za-z0-9_]+)>.GetEmptyObject', 'g'), 'ObjectPool.GetEmptyObject<$1>')

    s = s.replaceAll('System.e:', 'e:')

    // Replace `private static ExplosionInterval(): number => GetRandomReal(MIN_EXPLODE_INTERVAL, MAX_EXPLODE_INTERVAL);` to `private static ExplosionInterval(): number { return GetRandomReal(MIN_EXPLODE_INTERVAL, MAX_EXPLODE_INTERVAL); }`
    s = s.replaceAll(new RegExp('((private|public).*?)=>(.*)', 'g'), '$1 { return$3 }')

    return s
}

/* --------------------------------- RUN --------------------------------- */
main().catch(err => {
    console.error(err)
    process.exit(1)
})
