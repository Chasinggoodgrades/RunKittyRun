export class Windwalk {
    private static Trigger: Trigger
    private static HotkeyTrigger: Trigger
    private static WindwalkID: number = FourCC('BOwk') // Windwalk buff ID
    public static Initialize() {
        RegisterHotKey()
        RegisterWWCast()
    }

    private static RegisterWWCast() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        Trigger = Trigger.create()!
        for (let player of Globals.ALL_PLAYERS)
            Trigger.registerPlayerUnitEvent(player, EVENT_PLAYER_UNIT_SPELL_CAST, null)
        Trigger.addCondition(Condition(() => GetSpellAbilityId() == Constants.ABILITY_WIND_WALK))
        Trigger.addAction(ApplyWindwalkEffect)
    }

    private static RegisterHotKey() {
        HotkeyTrigger = Trigger.create()!
        for (let p of Globals.ALL_PLAYERS) {
            HotkeyTrigger.RegisterPlayerKeyEvent(p, oskeytype.NumPad0, 0, true)
        }
        HotkeyTrigger.addAction(RegisterHotKeyEvents)
    }

    private static RegisterHotKeyEvents() {
        let p: MapPlayer = getTriggerPlayer()
        let k: Kitty = Globals.ALL_KITTIES.get(p)!

        if (!k.isAlive()) return // cannot cast if dead obviously.
        if (UnitHasBuffBJ(k.Unit, WindwalkID)) return
        k.Unit.IssueOrder('windwalk')
        k.Unit.IssueOrder(WolfPoint.MoveOrderID, k.APMTracker.LastX, k.APMTracker.LastY)
    }

    private static ApplyWindwalkEffect() {
        let caster = getTriggerUnit()
        let player = caster.owner
        let kitty = Globals.ALL_KITTIES.get(player)!
        let abilityLevel = caster.getAbilityLevel(Constants.ABILITY_WIND_WALK)
        let duration = 3.0 + 2.0 * abilityLevel
        let wwID = kitty.ActiveAwards.WindwalkID
        try {
            // AmuletOfEvasiveness.AmuletWindwalkEffect(caster);
            if (wwID != 0) {
                let reward = RewardsManager.Rewards.find(r => r.GetAbilityID() == wwID)
                let visual = reward.ModelPath
                let e = caster.AddSpecialEffect(visual, 'origin')
                if (e != null) {
                    Utility.SimpleTimer(duration, () => {
                        if (e != null) DestroyEffect(e)
                    })
                }
            }
        } catch (e: any) {
            Logger.Warning('Error in Windwalk.ApplyWindwalkEffect: {e.Message}')
        }
    }
}
