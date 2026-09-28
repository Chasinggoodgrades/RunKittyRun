import { assertDefined } from './utils'

/**
 * From common natives
 */

const Common = {
    UPlayer: (playerNumber: number) => assertDefined(Player(playerNumber), 'Player'),

    UGetWorldBounds: () => assertDefined(GetWorldBounds(), 'GetWorldBounds'),

    UCreateDestructable: (objectid: number, x: number, y: number, face: number, scale: number, variation: number) =>
        assertDefined(CreateDestructable(objectid, x, y, face, scale, variation), 'CreateDestructable'),

    UCreateUnit: (player: player, unitId: number, x: number, y: number, face: number) =>
        assertDefined(CreateUnit(player, unitId, x, y, face), 'CreateUnit'),

    UGetExpiredTimer: () => assertDefined(GetExpiredTimer(), 'GetExpiredTimer'),

    UGetTriggerPlayer: () => assertDefined(GetTriggerPlayer(), 'GetTriggerPlayer'),

    UGetTriggerUnit: () => assertDefined(GetTriggerUnit(), 'GetTriggerUnit'),

    UGetTriggeringTrigger: () => assertDefined(GetTriggeringTrigger(), 'GetTriggeringTrigger'),

    UGetPlayerName: (player: player) => assertDefined(GetPlayerName(player), 'GetPlayerName'),

    UConvertPlayerColor: (playerid: number) => assertDefined(ConvertPlayerColor(playerid), 'ConvertPlayerColor'),

    UCreateTextTag: () => assertDefined(CreateTextTag(), 'CreateTextTag'),

    UGetOrderTargetItem: () => assertDefined(GetOrderTargetItem(), 'GetOrderTargetItem'),

    UGetOrderTargetUnit: () => assertDefined(GetOrderTargetUnit(), 'GetOrderTargetUnit'),

    UCreateFogModifierRect: (
        forWhichPlayer: player,
        whichState: fogstate,
        where: rect,
        useSharedVision: boolean,
        afterUnits: boolean
    ) =>
        assertDefined(
            CreateFogModifierRect(forWhichPlayer, whichState, where, useSharedVision, afterUnits),
            'CreateFogModifierRect'
        ),

    UCreateGroup: () => assertDefined(CreateGroup(), 'CreateGroup'),

    UGetEnumUnit: () => assertDefined(GetEnumUnit(), 'GetEnumUnit'),

    UGetOrderTarget: () => assertDefined(GetOrderTarget(), 'GetOrderTarget'),

    UDialogCreate: () => assertDefined(DialogCreate(), 'DialogCreate'),

    UGetManipulatedItem: () => assertDefined(GetManipulatedItem(), 'GetManipulatedItem'),

    UBlzGetTriggerPlayerMouseButton: () =>
        assertDefined(BlzGetTriggerPlayerMouseButton(), 'BlzGetTriggerPlayerMouseButton'),

    UBlzGetOriginFrame: (frameType: originframetype, index: number) =>
        assertDefined(BlzGetOriginFrame(frameType, index), 'BlzGetOriginFrame'),

    UBlzGetFrameByName: (name: string, createContext: number) =>
        assertDefined(BlzGetFrameByName(name, createContext), 'BlzGetFrameByName'),

    UGetEventPlayerChatString: () => assertDefined(GetEventPlayerChatString(), 'GetEventPlayerChatString'),

    UBlzCreateFrame: (name: string, owner: framehandle, priority: number, createContext: number) =>
        assertDefined(BlzCreateFrame(name, owner, priority, createContext), 'BlzCreateFrame'),

    UBlzGetTriggerSyncData: () => assertDefined(BlzGetTriggerSyncData(), 'BlzGetTriggerSyncData'),

    UGetEnumDestructable: () => assertDefined(GetEnumDestructable(), 'GetEnumDestructable'),

    UGetTriggeringRegion: () => assertDefined(GetTriggeringRegion(), 'GetTriggeringRegion'),

    UGetLocalPlayer: () => assertDefined(GetLocalPlayer(), 'GetLocalPlayer'),
}

/**
 * From blizzard natives
 */

const Blizzard = {
    UAddSpecialEffectTargetUnitBJ: (attachPointName: string, targetWidget: widget, modelName: string) =>
        assertDefined(
            AddSpecialEffectTargetUnitBJ(attachPointName, targetWidget, modelName),
            'AddSpecialEffectTargetUnitBJ'
        ),

    UGetPlayableMapRect: () => assertDefined(GetPlayableMapRect(), 'GetPlayableMapRect'),

    UCreateMultiboardBJ: (cols: number, rows: number, title: string) =>
        assertDefined(CreateMultiboardBJ(cols, rows, title), 'CreateMultiboardBJ'),

    UGetPlayersAll: () => assertDefined(GetPlayersAll(), 'GetPlayersAll'),

    UCreateTextTagUnitBJ: (
        s: string,
        whichUnit: unit,
        zOffset: number,
        size: number,
        red: number,
        green: number,
        blue: number,
        transparency: number
    ) =>
        assertDefined(
            CreateTextTagUnitBJ(s, whichUnit, zOffset, size, red, green, blue, transparency),
            'CreateTextTagUnitBJ'
        ),

    UUnitItemInSlotBJ: (whichUnit: unit, itemSlot: number) =>
        assertDefined(UnitItemInSlotBJ(whichUnit, itemSlot), 'UnitItemInSlotBJ'),

    UGetEntireMapRect: () => assertDefined(GetEntireMapRect(), 'GetEntireMapRect'),
}

/**
 * Combine all unsecured natives and export them
 */
export const Natives = {
    ...Common,
    ...Blizzard,
}
