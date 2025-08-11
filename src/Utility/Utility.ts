class Utility {
    private static Locust: number = FourCC('Aloc')
    private static stringBuilder: StringBuilder = new StringBuilder()

    /// <summary>
    /// Makes the unit unclickable while remaining selectable.
    /// </summary>
    /// <param name="u"></param>
    public static MakeUnitLocust(u: unit) {
        u.AddAbility(Locust)
        ShowUnit(u, false)
        u.RemoveAbility(Locust)
        ShowUnit(u, true)
    }

    /// <summary>
    /// Selects the passed unit for the passed player parmeter. (adds to current unit group)
    /// </summary>
    /// <param name="p"></param>
    /// <param name="u"></param>
    public static SelectUnitForPlayer(p: player, u: unit) {
        if (GetLocalPlayer() != p) return
        ClearSelection()
        SelectUnit(u, true)
    }

    /// <summary>
    /// Display a timed text message to all players.
    /// </summary>
    /// <param name="duration">How long to show the message.</param>
    /// <param name="message">Whats the message?</param>
    public static TimedTextToAllPlayers(duration: number, message: string) {
        for (let i: number = 0; i < Globals.ALL_PLAYERS.Count; i++) {
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
    public static ConvertFloatToTime(time: number, teamID: number) {
        if (time <= 0.0) return '0:00.0'

        let minutes = time / 60
        let seconds = time % 60
        let tenths = (time * 10) % 10

        let timeString: string = seconds < 10 ? '{minutes}:0{seconds}.{tenths}' : '{minutes}:{seconds}.{tenths}'
        return Colors.ColorString(timeString, teamID)
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

    public static IsDeveloper(p: player) {
        try {
            for (let i: number = 0; i < Globals.VIPLIST.Length; i++) {
                if (GetPlayerName(p) == Base64.FromBase64(Globals.VIPLIST[i])) {
                    return true
                }
            }
            return false
        } catch (ex: Error) {
            Logger.Warning(ex.StackTrace)
            return false
        }
    }

    /// <summary>
    /// Creates a disposable timer for a specific duration to do a simple action.
    /// </summary>
    /// <param name="duration"></param>
    /// <param name="action"></param>
    public static SimpleTimer(duration: number, action: Action) {
        let handle = ObjectPool.GetEmptyObject<AchesTimers>()
        handle.Timer.Start(duration, false, () => {
            action()
            handle?.Dispose()
            handle = null
        })
    }

    /// <summary>
    /// Determines if the specified unit has an item with the given itemId.
    /// </summary>
    /// <param name="u">The unit to check for the item.</param>
    /// <param name="itemId">The ID of the item to check for.</param>
    /// <returns>True if the unit has the item, otherwise false.</returns>
    public static UnitHasItem(u: unit, itemId: number) {
        for (let i: number = 0; i < 6; i++) {
            if (GetItemTypeId(UnitItemInSlot(u, i)) == itemId) return true
        }
        return false
    }

    /// <summary>
    /// Returns how many of that item a player has in their inventory.
    /// </summary>
    /// <param name="u"></param>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static UnitHasItemCount(u: unit, itemId: number) {
        let count = 0
        for (let i: number = 0; i < 6; i++) {
            if (GetItemTypeId(UnitItemInSlot(u, i)) == itemId) count++
        }
        return count
    }

    /// <summary>
    /// Returns the item if the unit has it, otherwise null.
    /// </summary>
    /// <param name="u"></param>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static UnitGetItem(u: unit, itemId: number) {
        for (let i: number = 0; i < 6; i++) {
            if (GetItemTypeId(UnitItemInSlot(u, i)) == itemId) return UnitItemInSlot(u, i)
        }
        return null
    }

    /// <summary>
    /// Returns the slot of the item if the unit has it, otherwise -1.
    /// </summary>
    /// <param name="u"></param>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static GetSlotOfItem(u: unit, itemId: number) {
        for (let i: number = 0; i < 6; i++) {
            if (GetItemTypeId(UnitItemInSlot(u, i)) == itemId) return i
        }
        return -1
    }

    /// <summary>
    /// If the unit has the item, it'll be deleted.
    /// </summary>
    /// <param name="u"></param>
    /// <param name="itemId"></param>
    public static RemoveItemFromUnit(u: unit, itemId: number) {
        for (let i: number = 0; i < 6; i++) {
            if (GetItemTypeId(UnitItemInSlot(u, i)) == itemId) {
                UnitItemInSlot(u, i).Dispose()
                return
            }
        }
    }

    /// <summary>
    /// Obtains and returns the string path of the icon of an item.
    /// </summary>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static GetItemIconPath(itemId: number) {
        let item = CreateItem(itemId, 0, 0)
        let iconPath = item.Icon
        item.Dispose()
        item = null
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
        u: unit,
        height: number = 0.015,
        red: number = 255,
        green: number = 255,
        blue: number = 255
    ) {
        let tt = texttag.Create()
        tt.SetText(text, height)
        tt.SetColor(red, green, blue, 255)
        tt.SetPosition(u.X, u.Y, 0)
        tt.SetVelocity(0, 0.02)
        tt.SetVisibility(true)
        SimpleTimer(duration, () => tt?.Dispose())
    }

    /// <summary>
    /// Gives the player owner of u the amount of gold as well as shows a floating text displaying how much gold they recieved.
    /// </summary>
    /// <param name="amount"></param>
    /// <param name="u"></param>
    public static GiveGoldFloatingText(amount: number, u: unit) {
        u.Owner.Gold += amount
        CreateSimpleTextTag('+{amount} Gold', 2.0, u, 0.018, 255, 215, 0)
    }

    /// <summary>
    /// Creates an effect using the specified path at the given x and y coordinates,
    /// and disposes of it immediately.
    /// </summary>
    /// <param name="path">The path to the effect resource.</param>
    /// <param name="x">The x-coordinate at which to create the effect.</param>
    /// <param name="y">The y-coordinate at which to create the effect.</param>
    public static CreateEffectAndDispose(path: string, x: number, y: number) {
        let e: effect = effect.Create(path, x, y)
        e.Dispose()
    }

    /// <summary>
    /// Creates an effect using the specified path at the given unit and attach point,
    /// </summary>
    /// <param name="path"></param>
    /// <param name="u"></param>
    /// <param name="attachPoint"></param>
    public static CreateEffectAndDispose(path: string, u: unit, attachPoint: string) {
        let e: effect = effect.Create(path, u, attachPoint)
        e.Dispose()
    }

    /// <summary>
    /// Clears the screen of all messages for the given player.
    /// </summary>
    /// <param name="player"></param>
    public static ClearScreen(player: player) {
        if (!player.IsLocal) return
        ClearTextMessages()
    }

    /// <summary>
    /// Drops all items held by the specified unit.
    /// </summary>
    /// <param name="Unit">The unit whose items are to be dropped.</param>
    public static DropAllItems(Unit: unit) {
        for (let i: number = 0; i < 6; i++) {
            let item = UnitItemInSlot(Unit, i)
            if (item != null) UnitDropItemPoint(Unit, item, Unit.X, Unit.Y)
        }
    }

    /// <summary>
    /// Adds mana to a unit, without exceeding the unit's maximum mana.
    /// </summary>
    /// <param name="unit">The unit to which mana is to be added.</param>
    /// <param name="amount">The amount of mana to add.</param>
    public static UnitAddMana(unit: unit, amount: number) {
        let maxMana = unit.MaxMana
        let currentMana = unit.Mana
        let newMana = currentMana + amount

        unit.Mana = newMana >= maxMana ? maxMana - 1 : newMana
    }

    /// <summary>
    /// Formats an award name by inserting spaces before capital letters.
    /// </summary>
    /// <param name="awardName">The award name to be formatted.</param>
    /// <returns>The formatted award name.</returns>
    public static FormatAwardName(awardName: string) {
        stringBuilder.Clear()
        for (let i: number = 0; i < awardName.Length; i++) {
            if (i > 0 && char.IsUpper(awardName[i])) {
                stringBuilder.Append(' ')
            }
            stringBuilder.Append(awardName[i])
        }

        let s = stringBuilder.ToString()
        return s
    }

    /// <summary>
    /// Makes a player a spectator by removing them from their team,
    /// disposing of their in-game objects, and refreshing the game state.
    /// </summary>
    /// <param name="player">The player to be made a spectator.</param>
    public static MakePlayerSpectator(player: player) {
        PlayerLeaves.TeamRemovePlayer(player)
        Globals.ALL_KITTIES[player].Dispose()
        Globals.ALL_CIRCLES[player].Dispose()
        Globals.ALL_PLAYERS.Remove(player)
        Globals.ALL_KITTIES[player].NameTag?.Dispose()
        RoundManager.RoundEndCheck()
        MultiboardUtil.RefreshMultiboards()
    }

    public static GetPlayerByName(playerName: string): player {
        // if playername is close to a player name, return.. However playerName should be atleast 3 chars long
        if (playerName.Length < 3) return null
        for (let i: number = 0; i < Globals.ALL_PLAYERS.Count; i++) {
            let p = Globals.ALL_PLAYERS[i]
            if (GetPlayerName(p).ToLower().Contains(playerName.ToLower())) {
                return p
            }
        }
        return null
    }

    public static GetItemSkin(itemId: number) {
        if (itemId == 0) return 0
        let item = CreateItem(itemId, 0, 0)
        let skin = BlzGetItemSkin(item)
        item.Dispose()
        item = null
        return skin
    }

    public static EffectReplayMagic(effect: effect, x: number, y: number, z: number) {
        BlzSetSpecialEffectAlpha(effect, 255)
        BlzSetSpecialEffectColor(effect, 255, 255, 255)
        BlzSetSpecialEffectTime(effect, 0)
        BlzSetSpecialEffectTimeScale(effect, 0.0)
        BlzSpecialEffectClearSubAnimations(effect)
        effect.SetPosition(x, y, z)
        BlzPlaySpecialEffect(effect, animtype.Birth)
    }

    public static FormattedColorPlayerName(p: player) {
        // removes everything after '#' in the player name
        let name = GetPlayerName(p).split('#')[0]
        return '{Colors.ColorString(name, p.Id + 1)}'
    }

    public static CreateFilterFunc(func: Func<bool>): filterfunc {
        return filterfunc.Create(func)
    }
}
