export class Safezone {
    public Region: region
    private Trigger: Trigger
    public ID: number
    public Rect_: Rectangle
    public Rectangle: Rectangle
    public AwardedPlayers: MapPlayer[] = []

    public Safezone(id: number, region: region) {
        ID = id
        Region = region
        let Trigger = Trigger.create()!
    }

    public static Initialize() {
        let count = 0
        for (let safeZone in RegionList.SafeZones) {
            let safezone = new Safezone(count, safeZone.Region)
            Globals.SAFE_ZONES.push(safezone)
            safezone.EnterSafezoneEvents()
            safezone.Rect_ = safeZone.Rect
            safezone.Rectangle = safeZone
            count++
        }
        FinalSafezone.Initialize()
    }

    private EnterSafezoneEvents() {
        Trigger.RegisterEnterRegion(Region, FilterList.KittyFilterOrShadow)
        Trigger.addAction(EnterSafezoneActions)
    }

    private EnterSafezoneActions() {
        try {
            let unit = getTriggerUnit()
            if (WolfEntersSafezoneActions(unit)) return
            if (GetUnitTypeId(unit) == Constants.UNIT_SHADOWKITTY_RELIC_SUMMON) {
                WolfLaneHider.ShadowKittyLaneAdd(ID)
                return
            }
            let player = unit.owner
            let kitty = Globals.ALL_KITTIES.get(player)!
            SafezoneAdditions(kitty)
            kitty.CurrentSafeZone = ID
            if (Globals.GAME_ACTIVE) WolfLaneHider.LanesHider()
            TeamDeathless.ReachedSafezone(unit, this)
            if (AwardedPlayers.includes(player) || ID == 0) return
            ChainedTogether.ReachedSafezone(kitty)
            Utility.GiveGoldFloatingText(Resources.SafezoneGold, unit)
            unit.Experience += Resources.SafezoneExperience
            AwardedPlayers.push(player)
            DeathlessChallenges.DeathlessCheck(kitty)
        } catch (e: any) {
            Logger.Warning('Error in EnterSafezoneActions: {e.Message}')
        }
    }

    /// <summary>
    /// Runs if the players current safezone isn't the same as their previously touched safezone.
    /// </summary>
    private SafezoneAdditions(kitty: Kitty) {
        let player = kitty.Player

        if (kitty.CurrentSafeZone == ID) return

        CameraUtil.UpdateKomotoCam(player, ID)

        if (Gamemode.CurrentGameMode != GameMode.Standard) return

        for (let i: number = 0; i < kitty.Relics.length; i++) {
            let relic = kitty.Relics[i]
            if (relic instanceof FangOfShadows) {
                let fangOfShadows: FangOfShadows = relic
                fangOfShadows.ReduceCooldownAtSafezone(kitty.Unit)
                break
            }
        }
    }

    /// <summary>
    /// Resets progress zones and reached safezones to initial state.
    /// </summary>
    public static ResetPlayerSafezones() {
        for (let kitty in Globals.ALL_KITTIES) {
            kitty.Value.CurrentSafeZone = 0
            kitty.Value.ProgressZone = 0
        }
        for (let safezone in Globals.SAFE_ZONES) {
            safezone.AwardedPlayers.clear()
        }
    }

    /// <summary>
    /// Counts the number of safezones a player has touched.
    /// </summary>
    /// <param name="player"></param>
    /// <returns>int count of the # of safezones reached.</returns>
    public static CountHitSafezones(player: MapPlayer) {
        let count: number = 0
        for (let safezone in Globals.SAFE_ZONES) {
            if (safezone.AwardedPlayers.includes(player)) count++
        }
        return count
    }

    /// <summary>
    /// If the unit type is a wolf, it'll tell the wolf to MOVE back to its wolf area.
    /// Primary purpose is to make it so "wander" wolves dont get into the safezones.
    /// </summary>
    /// <param name="unit"></param>
    /// <returns>bool [true/false] if unit type is infact a wolf</returns>
    public static WolfEntersSafezoneActions(unit: Unit) {
        if (GetUnitTypeId(unit) != Wolf.WOLF_MODEL) return false
        let wolf = Globals.ALL_WOLVES[unit]
        wolf.WolfMove(true) // forced move
        return true
    }
}
