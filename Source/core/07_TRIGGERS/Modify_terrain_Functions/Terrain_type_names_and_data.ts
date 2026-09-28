import { TerrainTypeGrass } from './Terrain_type_grass'
import { TerrainTypeMax } from './Terrain_type_max'

const TERRAIN_TYPE_NAMES: string[] = []
const TERRAIN_TYPE_DATA: string[] = []
const NB_TERRAINS_TOTAL = 177

const initTerrainTypeNamesAndData = () => {
    const init_TerrainTypeNamesAndData = () => {
        let maxId: number
        let terrain: number
        let grassId: number
        let S: string

        TERRAIN_TYPE_NAMES[1] = 'Eté de Lordaeron - Terre'
        TERRAIN_TYPE_NAMES[2] = 'Eté de Lordaeron - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[3] = 'Eté de Lordaeron - Terre herbeuse'
        TERRAIN_TYPE_NAMES[4] = 'Eté de Lordaeron - Rochers'
        TERRAIN_TYPE_NAMES[5] = 'Eté de Lordaeron - Herbe'
        TERRAIN_TYPE_NAMES[6] = 'Eté de Lordaeron - Herbe sombre'
        TERRAIN_TYPE_NAMES[7] = 'Automne de Lordaeron - Terre'
        TERRAIN_TYPE_NAMES[8] = 'Automne de Lordaeron - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[9] = 'Automne de Lordaeron - Terre herbeuse'
        TERRAIN_TYPE_NAMES[10] = 'Automne de Lordaeron - Rochers'
        TERRAIN_TYPE_NAMES[11] = 'Automne de Lordaeron - Herbe'
        TERRAIN_TYPE_NAMES[12] = 'Automne de Lordaeron - Herbe sombre'
        TERRAIN_TYPE_NAMES[13] = 'Hiver de Lordaeron - Terre'
        TERRAIN_TYPE_NAMES[14] = 'Hiver de Lordaeron - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[15] = 'Hiver de Lordaeron - Terre herbeuse'
        TERRAIN_TYPE_NAMES[16] = 'Hiver de Lordaeron - Rochers'
        TERRAIN_TYPE_NAMES[17] = 'Hiver de Lordaeron - Herbe'
        TERRAIN_TYPE_NAMES[18] = 'Hiver de Lordaeron - Neige'
        TERRAIN_TYPE_NAMES[19] = 'Barrens - Terre'
        TERRAIN_TYPE_NAMES[20] = 'Barrens - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[21] = 'Barrens - Cailloux'
        TERRAIN_TYPE_NAMES[22] = 'Barrens - Terre herbeuse'
        TERRAIN_TYPE_NAMES[23] = 'Barrens - Désert'
        TERRAIN_TYPE_NAMES[24] = 'Barrens - Désert sombre'
        TERRAIN_TYPE_NAMES[25] = 'Barrens - Rochers'
        TERRAIN_TYPE_NAMES[26] = 'Barrens - Herbe'
        TERRAIN_TYPE_NAMES[27] = 'Ashenvale - Terre'
        TERRAIN_TYPE_NAMES[28] = 'Ashenvale - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[29] = 'Ashenvale - Herbe'
        TERRAIN_TYPE_NAMES[30] = 'Ashenvale - Rochers'
        TERRAIN_TYPE_NAMES[31] = "Ashenvale - Touffes d'herbe"
        TERRAIN_TYPE_NAMES[32] = 'Ashenvale - Vignes'
        TERRAIN_TYPE_NAMES[33] = 'Ashenvale - Terre herbeuse'
        TERRAIN_TYPE_NAMES[34] = 'Ashenvale - Feuilles'
        TERRAIN_TYPE_NAMES[35] = 'Felwood - Terre'
        TERRAIN_TYPE_NAMES[36] = 'Felwood - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[37] = 'Felwood - Poison'
        TERRAIN_TYPE_NAMES[38] = 'Felwood - Rochers'
        TERRAIN_TYPE_NAMES[39] = 'Felwood - Vignes'
        TERRAIN_TYPE_NAMES[40] = 'Felwood - Herbe'
        TERRAIN_TYPE_NAMES[41] = 'Felwood - Feuilles'
        TERRAIN_TYPE_NAMES[42] = 'Northrend - Terre'
        TERRAIN_TYPE_NAMES[43] = 'Northrend - Terre sombre'
        TERRAIN_TYPE_NAMES[44] = 'Northrend - Rochers'
        TERRAIN_TYPE_NAMES[45] = 'Northrend - Herbe'
        TERRAIN_TYPE_NAMES[46] = 'Northrend - Glace'
        TERRAIN_TYPE_NAMES[47] = 'Northrend - Neige'
        TERRAIN_TYPE_NAMES[48] = 'Northrend - Neige rocailleuse'
        TERRAIN_TYPE_NAMES[49] = 'Cité - Terre'
        TERRAIN_TYPE_NAMES[50] = 'Cité - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[51] = 'Cité - Marbre noir'
        TERRAIN_TYPE_NAMES[52] = 'Cité - Briques'
        TERRAIN_TYPE_NAMES[53] = 'Cité - Dalles carrées'
        TERRAIN_TYPE_NAMES[54] = 'Cité - Dalles rondes'
        TERRAIN_TYPE_NAMES[55] = 'Cité - Herbe'
        TERRAIN_TYPE_NAMES[56] = 'Cité - Jardin'
        TERRAIN_TYPE_NAMES[57] = 'Cité - Marbre blanc'
        TERRAIN_TYPE_NAMES[58] = 'Village - Terre'
        TERRAIN_TYPE_NAMES[59] = 'Village - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[60] = 'Village - Champs'
        TERRAIN_TYPE_NAMES[61] = 'Village - Chemin caillouteux'
        TERRAIN_TYPE_NAMES[62] = 'Village - Chemin pavé'
        TERRAIN_TYPE_NAMES[63] = 'Village - Herbe courte'
        TERRAIN_TYPE_NAMES[64] = 'Village - Rochers'
        TERRAIN_TYPE_NAMES[65] = 'Village - Herbe épaisse'
        TERRAIN_TYPE_NAMES[66] = 'Village en automne - Terre'
        TERRAIN_TYPE_NAMES[67] = 'Village en automne - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[68] = 'Village en automne - Champs'
        TERRAIN_TYPE_NAMES[69] = 'Village en automne - Chemin caillouteux'
        TERRAIN_TYPE_NAMES[70] = 'Village en automne - Chemin pavé'
        TERRAIN_TYPE_NAMES[71] = 'Village en automne - Herbe courte'
        TERRAIN_TYPE_NAMES[72] = 'Village en automne - Rochers'
        TERRAIN_TYPE_NAMES[73] = 'Village en automne - Herbe épaisse'
        TERRAIN_TYPE_NAMES[74] = 'Dalaran - Terre'
        TERRAIN_TYPE_NAMES[75] = 'Dalaran - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[76] = 'Dalaran - Marbre noir'
        TERRAIN_TYPE_NAMES[77] = 'Dalaran - Briques'
        TERRAIN_TYPE_NAMES[78] = 'Dalaran - Dalles carrées'
        TERRAIN_TYPE_NAMES[79] = 'Dalaran - Dalles rondes'
        TERRAIN_TYPE_NAMES[80] = 'Dalaran - Herbe'
        TERRAIN_TYPE_NAMES[81] = 'Dalaran - Jardin'
        TERRAIN_TYPE_NAMES[82] = 'Dalaran - Marbre blanc'
        TERRAIN_TYPE_NAMES[83] = 'Donjon - Terre'
        TERRAIN_TYPE_NAMES[84] = 'Donjon - Briques'
        TERRAIN_TYPE_NAMES[85] = 'Donjon - Pierres rouges'
        TERRAIN_TYPE_NAMES[86] = 'Donjon - Fissures de lave'
        TERRAIN_TYPE_NAMES[87] = 'Donjon - Lave'
        TERRAIN_TYPE_NAMES[88] = 'Donjon - Rochers noirs'
        TERRAIN_TYPE_NAMES[89] = 'Donjon - Pierres grises'
        TERRAIN_TYPE_NAMES[90] = 'Donjon - Dalles carrées'
        TERRAIN_TYPE_NAMES[91] = 'Souterrain - Terre'
        TERRAIN_TYPE_NAMES[92] = 'Souterrain - Briques'
        TERRAIN_TYPE_NAMES[93] = 'Souterrain - Pierres rouges'
        TERRAIN_TYPE_NAMES[94] = 'Souterrain - Morceaux de glace'
        TERRAIN_TYPE_NAMES[95] = 'Souterrain - Glace'
        TERRAIN_TYPE_NAMES[96] = 'Souterrain - Rochers noirs'
        TERRAIN_TYPE_NAMES[97] = 'Souterrain - Pierres grises'
        TERRAIN_TYPE_NAMES[98] = 'Souterrain - Dalles carrées'
        TERRAIN_TYPE_NAMES[99] = 'Ruines englouties - Terre'
        TERRAIN_TYPE_NAMES[100] = 'Ruines englouties - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[101] = 'Ruines englouties - Terre herbeuse'
        TERRAIN_TYPE_NAMES[102] = 'Ruines englouties - Petites briques'
        TERRAIN_TYPE_NAMES[103] = 'Ruines englouties - Sable'
        TERRAIN_TYPE_NAMES[104] = 'Ruines englouties - Grandes briques'
        TERRAIN_TYPE_NAMES[105] = 'Ruines englouties - Dalles rondes'
        TERRAIN_TYPE_NAMES[106] = 'Ruines englouties - Herbe'
        TERRAIN_TYPE_NAMES[107] = 'Ruines englouties - Herbe sombre'
        TERRAIN_TYPE_NAMES[108] = "Glacier d'Icecrown - Terre"
        TERRAIN_TYPE_NAMES[109] = "Glacier d'Icecrown - Terre rocailleuse"
        TERRAIN_TYPE_NAMES[110] = "Glacier d'Icecrown - Glace sombre"
        TERRAIN_TYPE_NAMES[111] = "Glacier d'Icecrown - Briques noires"
        TERRAIN_TYPE_NAMES[112] = "Glacier d'Icecrown - Briques runiques"
        TERRAIN_TYPE_NAMES[113] = "Glacier d'Icecrown - Briques empilées"
        TERRAIN_TYPE_NAMES[114] = "Glacier d'Icecrown - Glace"
        TERRAIN_TYPE_NAMES[115] = "Glacier d'Icecrown - Carrés noirs"
        TERRAIN_TYPE_NAMES[116] = "Glacier d'Icecrown - Neige"
        TERRAIN_TYPE_NAMES[117] = 'Terres dévastées - Terre'
        TERRAIN_TYPE_NAMES[118] = 'Terres dévastées - Terre claire'
        TERRAIN_TYPE_NAMES[119] = 'Terres dévastées - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[120] = 'Terres dévastées - Terre craquelée'
        TERRAIN_TYPE_NAMES[121] = 'Terres dévastées - Pierres plates'
        TERRAIN_TYPE_NAMES[122] = 'Terres dévastées - Rochers'
        TERRAIN_TYPE_NAMES[123] = 'Terres dévastées - Pierres plates claires'
        TERRAIN_TYPE_NAMES[124] = 'Terres dévastées - Abysse'
        TERRAIN_TYPE_NAMES[125] = 'Catacombes - Terre'
        TERRAIN_TYPE_NAMES[126] = 'Catacombes - Terre claire'
        TERRAIN_TYPE_NAMES[127] = 'Catacombes - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[128] = 'Catacombes - Pierres plates'
        TERRAIN_TYPE_NAMES[129] = 'Catacombes - Petites briques'
        TERRAIN_TYPE_NAMES[130] = 'Catacombes - Grandes briques'
        TERRAIN_TYPE_NAMES[131] = 'Catacombes - Dalles carrées'
        TERRAIN_TYPE_NAMES[132] = 'Catacombes - Dalles sombres'
        TERRAIN_TYPE_NAMES[133] = 'Ruines de Dalaran - Terre'
        TERRAIN_TYPE_NAMES[134] = 'Ruines de Dalaran - Terre rocailleuse'
        TERRAIN_TYPE_NAMES[135] = 'Ruines de Dalaran - Marbre noir'
        TERRAIN_TYPE_NAMES[136] = 'Ruines de Dalaran - Dalles en brique'
        TERRAIN_TYPE_NAMES[137] = 'Ruines de Dalaran - Dalles carrées'
        TERRAIN_TYPE_NAMES[138] = 'Ruines de Dalaran - Dalles rondes'
        TERRAIN_TYPE_NAMES[139] = 'Ruines de Dalaran - Herbe'
        TERRAIN_TYPE_NAMES[140] = 'Ruines de Dalaran - Jardin'
        TERRAIN_TYPE_NAMES[141] = 'Ruines de Dalaran - Marbre blanc'
        TERRAIN_TYPE_NAMES[142] = 'Ashenvale - Falaise'
        TERRAIN_TYPE_NAMES[143] = 'Ashenvale - Falaise herbeuse'
        TERRAIN_TYPE_NAMES[144] = 'Barrens - Falaise désertique'
        TERRAIN_TYPE_NAMES[145] = 'Barrens - Falaise herbeuse'
        TERRAIN_TYPE_NAMES[146] = 'Catacombes - Falaise'
        TERRAIN_TYPE_NAMES[147] = 'Catacombes - Falaise de tuiles noires'
        TERRAIN_TYPE_NAMES[148] = 'Cité - Falaise'
        TERRAIN_TYPE_NAMES[149] = 'Cité - Falaise de tuiles carrées'
        TERRAIN_TYPE_NAMES[150] = 'Dalaran - Falaise'
        TERRAIN_TYPE_NAMES[151] = 'Dalaran - Falaise de tuiles carrées'
        TERRAIN_TYPE_NAMES[152] = 'Ruines de Dalaran - Falaise'
        TERRAIN_TYPE_NAMES[153] = 'Ruines de Dalaran - Falaise de tuiles carrées'
        TERRAIN_TYPE_NAMES[154] = 'Donjon - Falaise'
        TERRAIN_TYPE_NAMES[155] = 'Donjon - Falaise de tuiles carrées'
        TERRAIN_TYPE_NAMES[156] = 'Felwood - Falaise'
        TERRAIN_TYPE_NAMES[157] = 'Felwood - Falaise herbeuse'
        TERRAIN_TYPE_NAMES[158] = "Glacier d'Icecrown - Falaise de briques runiques"
        TERRAIN_TYPE_NAMES[159] = "Glacier d'Icecrown - Falaise enneigée"
        TERRAIN_TYPE_NAMES[160] = 'Automne de Lordaeron - Falaise'
        TERRAIN_TYPE_NAMES[161] = 'Automne de Lordaeron - Falaise herbeuse'
        TERRAIN_TYPE_NAMES[162] = 'Eté de Lordaeron - Falaise'
        TERRAIN_TYPE_NAMES[163] = 'Eté de Lordaeron - Falaise herbeuse'
        TERRAIN_TYPE_NAMES[164] = 'Hiver de Lordaeron - Falaise herbeuse'
        TERRAIN_TYPE_NAMES[165] = 'Hiver de Lordaeron - Falaise enneigée'
        TERRAIN_TYPE_NAMES[166] = 'Northrend - Falaise'
        TERRAIN_TYPE_NAMES[167] = 'Northrend - Falaise enneigée'
        TERRAIN_TYPE_NAMES[168] = 'Terres dévastées - Falaise abyssale'
        TERRAIN_TYPE_NAMES[169] = 'Terres dévastées - Falaise ardue'
        TERRAIN_TYPE_NAMES[170] = 'Ruines englouties - Falaise'
        TERRAIN_TYPE_NAMES[171] = 'Ruines englouties - Falaise de tuiles larges'
        TERRAIN_TYPE_NAMES[172] = 'Souterrain - Falaise'
        TERRAIN_TYPE_NAMES[173] = 'Souterrain - Falaise de tuiles carrées'
        TERRAIN_TYPE_NAMES[174] = 'Village - Falaise'
        TERRAIN_TYPE_NAMES[175] = "Village - Falaise d'herbe épaisse"
        TERRAIN_TYPE_NAMES[176] = 'Village en automne - Falaise'
        TERRAIN_TYPE_NAMES[177] = "Village en automne - Falaise d'herbe épaisse"

        maxId = 1
        while (maxId <= NB_TERRAINS_TOTAL) {
            terrain = TerrainTypeMax.TerrainTypeMaxId2TerrainTypeId(maxId)
            S =
                TERRAIN_TYPE_NAMES[maxId] +
                ' :    ' +
                I2S(maxId) +
                '    ' +
                "'" +
                TerrainTypeMax.TerrainTypeId2TerrainTypeAsciiString(terrain) +
                "'"
            grassId = TerrainTypeGrass.TerrainTypeMaxId2GrassId(maxId)
            if (grassId !== 0) {
                S = S + '    g' + I2S(grassId)
            }

            TERRAIN_TYPE_DATA[maxId] = S
            maxId = maxId + 1
        }
    }

    return { TERRAIN_TYPE_NAMES, TERRAIN_TYPE_DATA, NB_TERRAINS_TOTAL, init_TerrainTypeNamesAndData }
}

export const TerrainTypeNamesAndData = initTerrainTypeNamesAndData()

export const init_TerrainTypeNamesAndData = initTerrainTypeNamesAndData().init_TerrainTypeNamesAndData
