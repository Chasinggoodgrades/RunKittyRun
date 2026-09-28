import { arrayPush } from '../../01_libraries/Basic_functions'
import { MemoryHandler } from '../../../Utils/MemoryHandler'

const MAX_DISPLAY_LENGTH = 1000
const MIN_LINE_LENGTH = 80

export const handlePaginationObj = (
    filtered: {
        [x: number]: { toText?: (parameterForToText: any) => string }
    },
    pageNum: number,
    parameterForToText?: any
) => {
    const arr = MemoryHandler.getEmptyArray<string>()

    for (const [_, v] of pairs(filtered)) {
        arrayPush(arr, v.toText?.(parameterForToText))
    }

    const r = handlePagination(arr, pageNum)

    MemoryHandler.destroyObject(arr)

    return r
}

export const handlePagination = (filtered: string[], pageNum: number) => {
    const pages: string[][] = []
    let currentPage: string[] = []
    let currentPageLength = 0

    for (const line of filtered) {
        const lineLength = Math.max(line.length, MIN_LINE_LENGTH)

        if (currentPageLength + lineLength > MAX_DISPLAY_LENGTH && currentPage.length > 0) {
            pages.push(currentPage)
            currentPage = []
            currentPageLength = 0
        }

        currentPage.push(line)
        currentPageLength += lineLength
    }

    if (currentPage.length > 0) {
        pages.push(currentPage)
    }

    const totalPages = pages.length
    const displayableCmds = pages[Math.max(pageNum, 1) - 1] || []

    return { cmds: displayableCmds, totalPages }
}

export const handlePaginationArgs = (cmd: string) => {
    // Get all params by splitting on space and removing first element (command name)
    const allParts = cmd.split(' ')
    const params = allParts.slice(1).filter(p => p !== '')

    // Separate search terms from page number
    const searchTerms: string[] = []
    let pageNum = 1

    for (const param of params) {
        const paramNum = S2I(param)
        if (paramNum > 0 && I2S(paramNum) === param) {
            // It's a number - use as page
            pageNum = paramNum
        } else {
            // It's a search term
            searchTerms.push(param.toLowerCase())
        }
    }

    return { searchTerms, pageNum }
}
