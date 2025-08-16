import { Globals } from 'src/Global/Globals'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { Effect, Item, MapPlayer, TextTag, Unit } from 'w3ts'
import { Action } from './CSUtils'
import { AchesTimers } from './MemoryHandler/AchesTimers'
import { MemoryHandler } from './MemoryHandler/MemoryHandler'

export class Utility {
    private static Locust: number = FourCC('Aloc')
    // StringBuilder is not available in TypeScript, so we'll use a string array for efficient concatenation
    private static stringBuilder: string[] = []

    /// <summary>
    /// Makes the unit unclickable while remaining selectable.
    /// </summary>
    /// <param name="u"></param>
    public static MakeUnitLocust(u: Unit) {
        u.addAbility(Utility.Locust)
        u.show = false
        u.removeAbility(Utility.Locust)
        u.show = true
    }

    /// <summary>
    /// Selects the passed unit for the passed player parmeter. (adds to current unit group)
    /// </summary>
    /// <param name="p"></param>
    /// <param name="u"></param>
    public static SelectUnitForPlayer(p: MapPlayer, u: Unit) {
        if (!p.isLocal()) return
        ClearSelection()
        u.select(true)
    }

    /// <summary>
    /// Display a timed text message to all players.
    /// </summary>
    /// <param name="duration">How long to show the message.</param>
    /// <param name="message">Whats the message?</param>
    public static TimedTextToAllPlayers(duration: number, message: string) {
        for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
            Globals.ALL_PLAYERS[i].DisplayTimedTextTo(duration, message)
        }
    }

    /// <summary>
    /// Converts a number to time string.
    /// Used for colorizing the time string in Teams mode.
    /// </summary>
    /// <summary>
    /// Converts a number to time string tenths.
    /// Used for colorizing the time string in Teams mode.
    /// </summary>
    public static ConvertFloatToTimeTeam(time: number, teamID: number) {
        if (time <= 0.0) return '0:00.0'

        let minutes = time / 60
        let seconds = time % 60
        let tenths = (time * 10) % 10

        let timeString: string = seconds < 10 ? '{minutes}:0{seconds}.{tenths}' : '{minutes}:{seconds}.{tenths}'
        return ColorUtils.ColorString(timeString, teamID)
    }

    /// <summary>
    /// Converts a number to time string tenths.
    /// No colorization.
    /// </summary>
    public static ConvertFloatToTime(time: number) {
        if (time <= 0.0) return '0:00.0'

        let minutes = time / 60
        let seconds = time % 60
        let tenths = (time * 10) % 10

        return seconds < 10 ? '{minutes}:0{seconds}.{tenths}' : '{minutes}:{seconds}.{tenths}'
    }

    /// <summary>
    /// Converts the number to a time string without tenths.
    /// </summary>
    /// <param name="time"></param>
    /// <returns></returns>
    public static ConvertFloatToTimeInt(time: number) {
        if (time <= 0.0) return '0:00'

        let minutes = time / 60
        let seconds = time % 60

        return seconds < 10 ? '{minutes}:0{seconds}' : '{minutes}:{seconds}'
    }

    /// <summary>
    /// Creates a disposable timer for a specific duration to do a simple action.
    /// </summary>
    /// <param name="duration"></param>
    /// <param name="action"></param>
    public static SimpleTimer(duration: number, action: Action) {
        let handle = MemoryHandler.getEmptyObject<AchesTimers>()
        handle.Timer.start(duration, false, () => {
            action()
            handle?.dispose()
        })
    }

    /// <summary>
    /// Determines if the specified unit has an item with the given itemId.
    /// </summary>
    /// <param name="u">The unit to check for the item.</param>
    /// <param name="itemId">The ID of the item to check for.</param>
    /// <returns>True if the unit has the item, otherwise false.</returns>
    public static UnitHasItem(u: Unit, itemId: number) {
        for (let i: number = 0; i < 6; i++) {
            if (u.getItemInSlot(i)?.typeId === itemId) return true
        }
        return false
    }

    /// <summary>
    /// Returns how many of that item a player has in their inventory.
    /// </summary>
    /// <param name="u"></param>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static UnitHasItemCount(u: Unit, itemId: number) {
        let count = 0
        for (let i: number = 0; i < 6; i++) {
            if (u.getItemInSlot(i)?.typeId === itemId) count++
        }
        return count
    }

    /// <summary>
    /// Returns the item if the unit has it, otherwise null.
    /// </summary>
    /// <param name="u"></param>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static UnitGetItem(u: Unit, itemId: number) {
        for (let i: number = 0; i < 6; i++) {
            if (u.getItemInSlot(i)?.typeId === itemId) return u.getItemInSlot(i)
        }

        return null
    }

    /// <summary>
    /// Returns the slot of the item if the unit has it, otherwise -1.
    /// </summary>
    /// <param name="u"></param>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static GetSlotOfItem(u: Unit, itemId: number) {
        for (let i: number = 0; i < 6; i++) {
            if (u.getItemInSlot(i)?.typeId === itemId) return i
        }
        return -1
    }

    /// <summary>
    /// Obtains and returns the string path of the icon of an item.
    /// </summary>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static GetItemIconPath(itemId: number) {
        let item = Item.create(itemId, 0, 0)!
        let iconPath = item.icon
        item.destroy()
        return iconPath
    }

    /// <summary>
    /// Self explanatory. Creates a texttag over the player's head.
    /// </summary>
    /// <param name="text"></param>
    /// <param name="duration"></param>
    /// <param name="u"></param>
    /// <param name="height"></param>
    /// <param name="red"></param>
    /// <param name="green"></param>
    /// <param name="blue"></param>
    public static CreateSimpleTextTag(
        text: string,
        duration: number,
        u: Unit,
        height: number = 0.015,
        red: number = 255,
        green: number = 255,
        blue: number = 255
    ) {
        let tt = TextTag.create()!
        tt.setText(text, height)
        tt.setColor(red, green, blue, 255)
        tt.setPos(u.x, u.y, 0)
        tt.setVelocity(0, 0.02)
        tt.setVisible(true)
        Utility.SimpleTimer(duration, () => tt?.destroy())
    }

    /// <summary>
    /// Gives the player owner of u the amount of gold as well as shows a floating text displaying how much gold they recieved.
    /// </summary>
    /// <param name="amount"></param>
    /// <param name="u"></param>
    public static GiveGoldFloatingText(amount: number, u: Unit) {
        u.owner.addGold(amount)
        Utility.CreateSimpleTextTag('+{amount} Gold', 2.0, u, 0.018, 255, 215, 0)
    }

    /// <summary>
    /// Creates an effect using the specified path at the given x and y coordinates,
    /// and disposes of it immediately.
    /// </summary>
    /// <param name="path">The path to the effect resource.</param>
    /// <param name="x">The x-coordinate at which to create the effect.</param>
    /// <param name="y">The y-coordinate at which to create the effect.</param>
    public static CreateEffectAndDispose(path: string, x: number, y: number) {
        let e = Effect.create(path, x, y)!
        e.destroy()
    }

    /// <summary>
    /// Creates an effect using the specified path at the given unit and attach point,
    /// </summary>
    /// <param name="path"></param>
    /// <param name="u"></param>
    /// <param name="attachPoint"></param>
    public static CreateEffectAndDisposeAttach(path: string, u: Unit, attachPoint: string) {
        let e = Effect.createAttachment(path, u, attachPoint)!
        e.destroy()
    }

    /// <summary>
    /// Clears the screen of all messages for the given player.
    /// </summary>
    /// <param name="player"></param>
    public static ClearScreen(player: MapPlayer) {
        if (!player.isLocal()) return
        ClearTextMessages()
    }

    /// <summary>
    /// Drops all items held by the specified unit.
    /// </summary>
    /// <param name="Unit">The unit whose items are to be dropped.</param>
    public static DropAllItems(Unit: Unit) {
        for (let i: number = 0; i < 6; i++) {
            let item = Unit.getItemInSlot(i)
            if (item) Unit.dropItem(item, Unit.x, Unit.y)
        }
    }

    /// <summary>
    /// Adds mana to a unit, without exceeding the unit's maximum mana.
    /// </summary>
    /// <param name="unit">The unit to which mana is to be added.</param>
    /// <param name="amount">The amount of mana to add.</param>
    public static UnitAddMana(unit: Unit, amount: number) {
        let maxMana = unit.maxMana
        let currentMana = unit.mana
        let newMana = currentMana + amount

        unit.mana = newMana >= maxMana ? maxMana - 1 : newMana
    }

    /// <summary>
    /// Formats an award name by inserting spaces before capital letters.
    /// </summary>
    /// <param name="awardName">The award name to be formatted.</param>
    public static FormatAwardName(awardName: string) {
        Utility.stringBuilder = []
        for (let i: number = 0; i < awardName.length; i++) {
            const char = awardName[i]
            if (i > 0 && char >= 'A' && char <= 'Z') {
                Utility.stringBuilder.push(' ')
            }
            Utility.stringBuilder.push(char)
        }

        let s = Utility.stringBuilder.join('')
        return s
    }

    public static GetPlayerByName(playerName: string) {
        // if playername is close to a player name, return.. However playerName should be atleast 3 chars long
        if (playerName.length < 3) return null
        for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
            let p = Globals.ALL_PLAYERS[i]
            if (p.name.toLowerCase().includes(playerName.toLowerCase())) {
                return p
            }
        }
        return null
    }

    public static GetItemSkin(itemId: number) {
        if (itemId === 0) return 0
        let item = Item.create(itemId, 0, 0)!
        let skin = item.skin
        item.destroy()
        return skin
    }

    public static EffectReplayMagic(effect: Effect, x: number, y: number, z: number) {
        effect.setAlpha(255)
        effect.setColor(255, 255, 255)
        effect.setTime(0)
        effect.setTimeScale(0)
        effect.clearSubAnimations()
        effect.setPosition(x, y, z)
        effect.playAnimation(ANIM_TYPE_BIRTH)
    }

    public static FormattedColorPlayerName(p: MapPlayer) {
        // removes everything after '#' in the player name
        let name = p.name.split('#')[0]
        return '{Colors.ColorString(name, p.id + 1)}'
    }

    public static CreateFilterFunc(func: () => boolean) {
        return func
    }
}

export const sumNumbers = (arr: number[]) => {
    let i = 0

    for (let num of arr) {
        i += num
    }

    return i
}

export const int = {
    MaxValue: Number.MAX_SAFE_INTEGER,
}

export const distanceBetweenXYPoints = (x1: number, y1: number, x2: number, y2: number) => {
    let dx = x2 - x1
    let dy = y2 - y1
    return Math.sqrt(dx * dx + dy * dy)
}

export const angleBetweenPoints = (x1: number, y1: number, x2: number, y2: number) => {
    let dx = x2 - x1
    let dy = y2 - y1
    return Math.atan2(dy, dx)
}

export enum MetaKey {
    None = 0,
    Shift = 1,
    Control = 2,
    Alt = 4,
    //
    // Summary:
    //     Windows/Super key.
    META = 8,
}

export const roundDecimals = (value: number, decimals: number = 0) => {
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
}

export enum TargetTypes {
    None = 1,
    Ground = 2,
    Air = 4,
    Structure = 8,
    Ward = 0x10,
    Item = 0x20,
    Tree = 0x40,
    Wall = 0x80,
    Debris = 0x100,
    Decoration = 0x200,
    Bridge = 0x400,
    Self = 0x1000,
    PlayerUnits = 0x2000,
    Allied = 0x4000,
    Neutral = 0x8000,
    Enemy = 0x10000,
    Vulnerable = 0x100000,
    Invulnerable = 0x200000,
    Hero = 0x400000,
    NonHero = 0x800000,
    Alive = 0x1000000,
    Dead = 0x2000000,
    Organic = 0x4000000,
    Mechanical = 0x8000000,
    //
    // Summary:
    //     Also known as "Non-Sapper".
    NonSuicidal = 0x10000000,
    //
    // Summary:
    //     Also known as "Sapper".
    Suicidal = 0x20000000,
    NonAncient = 0x40000000,
    Ancient = 0,
    NotSelf = 0x1e000,
    Friend = 0x6000,
}

export const PositionWithPolarOffsetRadX = (x: number, radius: number, angle: number): number => {
    return x + radius * Math.cos(angle)
}

export const PositionWithPolarOffsetRadY = (y: number, radius: number, angle: number): number => {
    return y + radius * Math.sin(angle)
}

export const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value))
}
