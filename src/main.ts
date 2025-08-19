import { Effect, Frame, MapPlayer, Multiboard, MultiboardItem, Rectangle, Timer, Trigger, Unit } from 'w3ts'
import { W3TS_HOOK, addScriptHook } from 'w3ts/hooks'
import { Program } from './Program'
import { ErrorHandler } from './Utility/ErrorHandler'

const tsMain = () => {
    try {
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

        Frame.prototype.getName = function (): string {
            return BlzFrameGetName(this.handle) || ''
        }

        const origAddAction = Trigger.prototype.addAction
        Trigger.prototype.addAction = function (action: () => void) {
            return origAddAction.call(this, ErrorHandler.Wrap(action))
        }

        const origStart = Timer.prototype.start
        Timer.prototype.start = function (timeout: number, periodic: boolean, callback: () => void) {
            return origStart.call(this, timeout, periodic, ErrorHandler.Wrap(callback))
        }

        new Program()
    } catch (e) {
        print(e)
    }
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, tsMain)
