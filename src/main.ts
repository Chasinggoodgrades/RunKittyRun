import { Units } from '@objectdata/units'
import { Effect, MapPlayer, Multiboard, MultiboardItem, Rectangle, Timer, Unit } from 'w3ts'
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

            MapPlayer.prototype.getLumber = function (): number {
                return GetPlayerState(this.handle, PLAYER_STATE_RESOURCE_LUMBER)
            }

            MapPlayer.prototype.setLumber = function (amount: number): void {
                SetPlayerState(this.handle, PLAYER_STATE_RESOURCE_LUMBER, amount)
            }

            MapPlayer.prototype.addLumber = function (amount: number): void {
                this.setLumber(this.getLumber() + amount)
            }

            Rectangle.prototype.includes = function (x: number, y: number): boolean {
                return this.minX <= x && x <= this.maxX && this.minY <= y && y <= this.maxY
            }

            Rectangle.prototype.region = function (): region {
                const region = CreateRegion()
                RegionAddRect(region, this.handle)
                return region
            }

            Multiboard.prototype.GetItem = function (row: number, column: number): MultiboardItem {
                return MultiboardItem.fromHandle(MultiboardGetItem(this.handle, row, column)!)
            }

            Multiboard.prototype.SetChildVisibility = function (visible: boolean, fade: boolean): void {
                MultiboardSetItemsStyle(this.handle, visible, fade)
            }

            MultiboardItem.prototype.setText = function (text: string): void {
                MultiboardSetItemValue(this.handle, text)
            }

            MultiboardItem.prototype.setVisible = function (visible: boolean, fade: boolean): void {
                MultiboardSetItemStyle(this.handle, visible, fade)
            }

            Unit.prototype.issueImmediateOrderById = function (orderId: number): void {
                IssueImmediateOrderById(this.handle, orderId)
            }

            Unit.prototype.addSpecialEffectTarget = function (model: string, attachmentPoint: string): Effect {
                return Effect.fromHandle(AddSpecialEffectTarget(model, this.handle, attachmentPoint))!
            }

            new Program()
        })
    } catch (e: any) {
        print(e)
    }
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, tsMain)
