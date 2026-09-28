import { getUdgLevels, getUdgMonsterTypes } from '../../../../globals'
import { MonsterSpawn } from '../../04_STRUCTURES/MonsterSpawn/MonsterSpawn'
import { RectangleRegion } from '../../04_STRUCTURES/Region/RectangleRegion'
import { Text } from '../../01_libraries/Text'
import { E2EAction, E2ETest } from './base/e2e-tests-base'

let monsterSpawn: MonsterSpawn | null = null

const actions: E2EAction[] = [
    {
        command: '-cf 3500, ui off, ldb off',
        function: () => {
            Text.mkA_timed(-1, `\nNew monster spawn "test": |r-crmsp test naga diagonal 1.5`)

            SetCameraPosition(-6300, 7400)

            const oldMonsterSpawn = getUdgLevels().getCurrentLevel().monsterSpawns.getByLabel('test')
            if (oldMonsterSpawn) {
                oldMonsterSpawn.destroy()
            }

            const mecRegion = new RectangleRegion(-8000, 7200, -6000, 9100, -5700, 6700)
            mecRegion.setWithEnterAndLeaveZone(true)
            mecRegion.debugRects(true)

            monsterSpawn = new MonsterSpawn(
                'test',
                getUdgMonsterTypes().getByLabel('naga')!,
                mecRegion,
                1.5,
                'straight'
            )
            getUdgLevels().getCurrentLevel().monsterSpawns.new(monsterSpawn, true)
        },
        waitAfter: 8,
    },
    {
        command: '-setMonsterSpawnFixedSpawnOffset test 256',
        waitAfter: 8,
    },
    {
        command: '-setMonsterSpawnFixedSpawnOffsetMirrored test 1',
        waitAfter: 8,
    },
    {
        command: '-setMonsterSpawnAmount test 2',
        waitAfter: 8,
    },
    // {
    //     command: '-setMonsterSpawnFixedSpawnOffsetBounce test 1',
    //     waitAfter: 8,
    // },
    {
        command: '-setMonsterSpawnAmount test 4',
        waitAfter: 4,
    },
    {
        command: '-setMonsterSpawnOffset test 128',
        waitAfter: 8,
    },
    // {
    //     command: '-setMonsterSpawnFixedSpawnOffsetBounce test 0',
    //     waitAfter: 8,
    // },
    {
        command: '-delms test',
        waitAfter: 3,
    },
]

function abortFunction() {
    if (monsterSpawn) {
        monsterSpawn.destroy()
        monsterSpawn = null
    }
}

export const spawn: E2ETest = {
    shortName: 'spawn',
    name: 'Monster spawns',
    actions,
    abortFunction,
}
