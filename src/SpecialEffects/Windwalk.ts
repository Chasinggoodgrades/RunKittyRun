class Windwalk {
    private static Trigger: trigger
    private static HotkeyTrigger: trigger
    private static WindwalkID: number = FourCC('BOwk') // Windwalk buff ID
    public static Initialize() {
        RegisterHotKey()
        RegisterWWCast()
    }

    private static RegisterWWCast() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        Trigger = trigger.Create()
        for (let player in Globals.ALL_PLAYERS)
            Trigger.RegisterPlayerUnitEvent(player, EVENT_PLAYER_UNIT_SPELL_CAST, null)
        Trigger.AddCondition(Condition(() => GetSpellAbilityId() == Constants.ABILITY_WIND_WALK))
        Trigger.AddAction(ApplyWindwalkEffect)
    }

    private static RegisterHotKey() {
        HotkeyTrigger = CreateTrigger()
        for (let p in Globals.ALL_PLAYERS) {
            HotkeyTrigger.RegisterPlayerKeyEvent(p, oskeytype.NumPad0, 0, true)
        }
        HotkeyTrigger.AddAction(RegisterHotKeyEvents)
    }

    private static RegisterHotKeyEvents() {
        let p: player = GetTriggerPlayer()
        let k: Kitty = Globals.ALL_KITTIES[p]

        if (!k.Alive) return // cannot cast if dead obviously.
        if (Blizzard.UnitHasBuffBJ(k.Unit, WindwalkID)) return
        k.Unit.IssueOrder('windwalk')
        k.Unit.IssueOrder(WolfPoint.MoveOrderID, k.APMTracker.LastX, k.APMTracker.LastY)
    }

    private static ApplyWindwalkEffect() {
        let caster = GetTriggerUnit()
        let player = caster.Owner
        let kitty = Globals.ALL_KITTIES[player]
        let abilityLevel = caster.GetAbilityLevel(Constants.ABILITY_WIND_WALK)
        let duration = 3.0 + 2.0 * abilityLevel
        let wwID = kitty.ActiveAwards.WindwalkID
        try {
            // AmuletOfEvasiveness.AmuletWindwalkEffect(caster);
            if (wwID != 0) {
                let reward = RewardsManager.Rewards.Find(r => r.GetAbilityID() == wwID)
                let visual = reward.ModelPath
                let e = caster.AddSpecialEffect(visual, 'origin')
                if (e != null) {
                    Utility.SimpleTimer(duration, () => {
                        if (e != null) DestroyEffect(e)
                    })
                }
            }
        } catch (e: Error) {
            Logger.Warning('Error in Windwalk.ApplyWindwalkEffect: {e.Message}')
        }
    }
}
