import { Units } from '@objectdata/units'
import { MapPlayer, Timer, Unit } from 'w3ts'
import { Players } from 'w3ts/globals'
import { W3TS_HOOK, addScriptHook } from 'w3ts/hooks'
import { Program } from './Program'

const BUILD_DATE = compiletime(() => new Date().toUTCString())
const TS_VERSION = compiletime(() => require('typescript').version)
const TSTL_VERSION = compiletime(() => require('typescript-to-lua').version)

compiletime(({ objectData, constants }) => {
    const unit = objectData.units.get(constants.units.Footman)

    if (!unit) {
        return
    }

    unit.modelFile = 'units\\human\\TheCaptain\\TheCaptain.mdl'

    objectData.save()
})

function tsMain() {
    try {
        print(`Build: ${BUILD_DATE}`)
        print(`Typescript: v${TS_VERSION}`)
        print(`Transpiler: v${TSTL_VERSION}`)
        print(' ')
        print('Welcome to TypeScript!')

        const unit = new Unit(Players[0], FourCC(Units.Footman), 0, 0, 270)

        Timer.create().start(1.0, true, () => {
            unit.color = Players[math.random(0, bj_MAX_PLAYERS)].color
        })

        // Surely this'll work
        MapPlayer.prototype.DisplayTimedTextTo = function (duration: number, message: string) {
            DisplayTimedTextToPlayer(this.handle, 0, 0, duration, message)
        }

        MapPlayer.prototype.DisplayTextTo = function (message: string) {
            DisplayTextToPlayer(this.handle, 0, 0, message)
        }

        MapPlayer.prototype.getGold = function (): number {
            return GetPlayerState(this.handle, PLAYER_STATE_RESOURCE_GOLD)
        }

        MapPlayer.prototype.setGold = function (amount: number): void {
            SetPlayerState(this.handle, PLAYER_STATE_RESOURCE_GOLD, amount)
        }

        MapPlayer.prototype.addGold = function (amount: number): void {
            this.setGold(this.getGold() + amount)
        }

        new Program()
    } catch (e: any) {
        print(e)
    }
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, tsMain)
