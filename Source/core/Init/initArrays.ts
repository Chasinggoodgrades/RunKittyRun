import { EscaperArray } from 'core/04_STRUCTURES/Escaper/EscaperArray'
import {
    setUdgCasterTypes,
    setUdgEscapers,
    setUdgLevels,
    setUdgMonsterTypes,
    setUdgTerrainSaves,
    setUdgTerrainTypes,
} from '../../../globals'
import { CasterTypeArray } from '../04_STRUCTURES/Caster/CasterTypeArray'
import { LevelArray } from '../04_STRUCTURES/Level/LevelArray'
import { MonsterTypeArray } from '../04_STRUCTURES/Monster/MonsterTypeArray'
import { TerrainSaveArray } from '../04_STRUCTURES/TerrainSave/TerrainSaveArray'
import { TerrainTypeArray } from '../04_STRUCTURES/TerrainType/TerrainTypeArray'

//Escapers
const initEscapers = () => {
    setUdgEscapers(new EscaperArray())
}

//Levels
export const initLevels = () => {
    setUdgLevels(new LevelArray())
}

//Terrain types
export const initTerrainTypes = () => {
    setUdgTerrainTypes(new TerrainTypeArray())
}

//Monster types
export const initMonsterTypes = () => {
    setUdgMonsterTypes(new MonsterTypeArray())
}

//Caster types
export const initCasterTypes = () => {
    setUdgCasterTypes(new CasterTypeArray())
}

//Terrain saves
export const initTerrainSaves = () => {
    setUdgTerrainSaves(new TerrainSaveArray())
}

//Init all arrays
export const initArrays = () => {
    initEscapers()
    initLevels()
    initTerrainTypes()
    initMonsterTypes()
    initCasterTypes()
    initTerrainSaves()
}
