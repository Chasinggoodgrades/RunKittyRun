import { globals } from '../../../globals'
import { DrawLineByLightningCode } from './Draw_lines'
import { arrayPush } from './Basic_functions'
import { ZLibrary } from '../02_bibliotheques_externes/ZLibrary'

const gridLines: lightning[] = []

export const ClearGrid = () => {
    for (const line of gridLines) {
        DestroyLightning(line)
    }
    gridLines.length = 0
}

const LINE_LENGTH_PRECISION_IN_SLK = 8192 / 2

const grid32size = 32
const grid128size = 128
const grid512size = 512

type gridOpacity = 5 | 10 | 15 | 25 | 50 | 75 | 100
type gridType = 32 | 128 | 512
type precisionLevel = 8192 | 128

let currentGridType: 0 | gridType
const currentGridOpacity: {
    grid512: gridOpacity
    grid128: gridOpacity
    grid32: gridOpacity
} = {
    grid512: 50,
    grid128: 50,
    grid32: 25,
}

function getLightningCode(precisionLevel: precisionLevel, lineType: gridType): string {
    return `precise${precisionLevel}Grid${lineType}a${currentGridOpacity[`grid${lineType}`]}`
}

export const DrawGrid = (type?: 0 | gridType) => {
    ClearGrid()

    if (type === undefined) {
        if (currentGridType === undefined || currentGridType === 0) {
            currentGridType = 512
        } else if (currentGridType === 512) {
            currentGridType = 128
        } else if (currentGridType === 128) {
            currentGridType = 32
        } else if (currentGridType === 32) {
            currentGridType = 0
        }
    } else {
        currentGridType = type
    }

    if (currentGridType === 0) {
        return
    }

    let delta = grid32size
    if (currentGridType === 128) {
        delta = grid128size
    } else if (currentGridType === 512) {
        delta = grid512size
    }

    if (currentGridType === 32) {
        // With grid3, do not handle terrain height, because we couldn't handle it for perfs
        const precisionLevel: precisionLevel = 8192

        // Vertical lines
        for (let x = globals.MAP_MIN_X; x <= globals.MAP_MAX_X; x += delta) {
            let lineType: gridType = 32
            if (x % grid512size === 0) {
                lineType = 512
            } else if (x % grid128size === 0) {
                lineType = 128
            }

            arrayPush(
                gridLines,
                DrawLineByLightningCode(
                    getLightningCode(precisionLevel, lineType),
                    x,
                    globals.MAP_MIN_Y - LINE_LENGTH_PRECISION_IN_SLK,
                    x,
                    globals.MAP_MAX_Y + LINE_LENGTH_PRECISION_IN_SLK
                )
            )
        }

        // Horizontal lines
        for (let y = globals.MAP_MIN_Y; y <= globals.MAP_MAX_Y; y += delta) {
            let lineType: gridType = 32
            if (y % grid512size === 0) {
                lineType = 512
            } else if (y % grid128size === 0) {
                lineType = 128
            }

            arrayPush(
                gridLines,
                DrawLineByLightningCode(
                    getLightningCode(precisionLevel, lineType),
                    globals.MAP_MIN_X - LINE_LENGTH_PRECISION_IN_SLK,
                    y,
                    globals.MAP_MAX_X + LINE_LENGTH_PRECISION_IN_SLK,
                    y
                )
            )
        }
    } else {
        // With grid1/2, do handle terrain height
        const precisionLevel: precisionLevel = 128

        // Vertical lines
        for (let x = globals.MAP_MIN_X; x <= globals.MAP_MAX_X; x += delta) {
            let lineType: gridType = 32
            if (x % grid512size === 0) {
                lineType = 512
            } else if (x % grid128size === 0) {
                lineType = 128
            }

            let startY = globals.MAP_MIN_Y
            let endY = globals.MAP_MIN_Y
            while (endY < globals.MAP_MAX_Y) {
                let commonHeight = ZLibrary.GetSurfaceZ(x, startY)
                let y = startY
                let height = commonHeight
                while (height === commonHeight) {
                    y += grid128size
                    if (y > globals.MAP_MAX_Y) {
                        break
                    }
                    height = ZLibrary.GetSurfaceZ(x, y)
                }

                if (y - startY === grid128size) {
                    endY = y
                } else {
                    endY = y - grid128size
                }
                if (endY > globals.MAP_MAX_Y) {
                    break
                }

                arrayPush(
                    gridLines,
                    DrawLineByLightningCode(getLightningCode(precisionLevel, lineType), x, startY, x, endY)
                )

                startY = endY
            }
        }

        // Horizontal lines
        for (let y = globals.MAP_MIN_Y; y <= globals.MAP_MAX_Y; y += delta) {
            let lineType: gridType = 32
            if (y % grid512size === 0) {
                lineType = 512
            } else if (y % grid128size === 0) {
                lineType = 128
            }

            let startX = globals.MAP_MIN_X
            let endX = globals.MAP_MIN_X
            while (endX < globals.MAP_MAX_X) {
                let commonHeight = ZLibrary.GetSurfaceZ(startX, y)
                let x = startX
                let height = commonHeight
                while (height === commonHeight) {
                    x += grid128size
                    if (x > globals.MAP_MAX_X) {
                        break
                    }
                    height = ZLibrary.GetSurfaceZ(x, y)
                }

                if (x - startX === grid128size) {
                    endX = x
                } else {
                    endX = x - grid128size
                }
                if (endX > globals.MAP_MAX_X) {
                    break
                }

                arrayPush(
                    gridLines,
                    DrawLineByLightningCode(getLightningCode(precisionLevel, lineType), startX, y, endX, y)
                )

                startX = endX
            }
        }
    }
}

const RefreshGrid = () => {
    if (currentGridType !== undefined && currentGridType !== 0) {
        DrawGrid(currentGridType)
    }
}

export const SetGridOpacity = (opacity: gridOpacity) => {
    if (!checkOpacityValue(opacity)) {
        return false
    }
    currentGridOpacity.grid512 = opacity
    currentGridOpacity.grid128 = opacity
    currentGridOpacity.grid32 = opacity
    RefreshGrid()

    return true
}

export const SetGridOpacityForAllGrids = (
    opacityGrid1: gridOpacity,
    opacityGrid2: gridOpacity,
    opacityGrid3: gridOpacity
) => {
    if (!checkOpacityValue(opacityGrid1) || !checkOpacityValue(opacityGrid2) || !checkOpacityValue(opacityGrid3)) {
        return false
    }
    currentGridOpacity.grid512 = opacityGrid1
    currentGridOpacity.grid128 = opacityGrid2
    currentGridOpacity.grid32 = opacityGrid3
    RefreshGrid()

    return true
}

export const checkOpacityValue = (opacity: number) => {
    return (
        opacity === 5 ||
        opacity === 10 ||
        opacity === 15 ||
        opacity === 25 ||
        opacity === 50 ||
        opacity === 75 ||
        opacity === 100
    )
}
