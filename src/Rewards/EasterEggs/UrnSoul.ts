export class UrnSoul {
    private static UrnRegions: rect[]
    private static UrnGhostUnit: Unit
    private static UnitType: number = Constants.UNIT_ASTRAL_KITTY
    private static Name: string = '|cff8080f?|r|cff6666f?|r|cff4d4dff?|r|cff3333f?|r|cff1a1aff?|r|cff0000f?|r'
    private static PeriodicTrigger: trigger
    private static UrnUsageTrigger: trigger
    private static InRangeTrigger: trigger
    private static RotationTime: number = 60.0
    private static InRangeDistance: number = 150.0
    private static RotationIndex: number = 0
    private static StartEventRegion: region

    public static Initialize() {
        RegisterRegions()
        UrnGhostUnit = UnitCreation()
        PeriodicTrigger = RegisterPeriodicTrigger()
        UrnUsageTrigger = RegisterUrnUsage()
        InRangeTrigger = RegisterInRangeEvent()
    }

    private static UnitCreation(): Unit {
        let u = unit.Create(player.NeutralAggressive, UnitType, 0, 0, 0)
        u.HeroName = Name
        u.SetPathing(false) // Disable Collision
        u.addAbility(FourCC('Agho')) // Ghost
        u.addAbility(FourCC('Augh')) // Shade
        u.IsInvulnerable = true
        return u
    }

    private static RegisterRegions() {
        UrnSoul.UrnRegions = [] // 4 premade regions from editor / constants
        UrnSoul.UrnRegions[0] = Regions.UrnSoulRegion1.Rect
        UrnSoul.UrnRegions[1] = Regions.UrnSoulRegion2.Rect
        UrnSoul.UrnRegions[2] = Regions.UrnSoulRegion3.Rect
        UrnSoul.UrnRegions[3] = Regions.UrnSoulRegion4.Rect
    }

    private static RegisterPeriodicTrigger(): trigger {
        let trig = CreateTrigger()
        TriggerRegisterTimerEvent(trig, RotationTime, true)
        trig.AddAction(RotationActions)
        return trig
    }

    private static RotationActions() {
        RotationIndex = (RotationIndex + 1) % 4
        let x = UrnRegions[RotationIndex].CenterX
        let y = UrnRegions[RotationIndex].CenterY
        UrnGhostUnit.IssueOrder('move', x, y)
    }

    private static RegisterUrnUsage(): trigger {
        let trig = CreateTrigger()
        for (let player in Globals.ALL_PLAYERS) trig.RegisterPlayerUnitEvent(player, playerunitevent.UseItem, null)
        trig.AddAction(UrnUsageActions)
        return trig
    }

    private static UrnUsageActions() {
        try {
            let item = GetManipulatedItem()
            let player = GetTriggerPlayer()
            let unit = GetTriggerUnit()
            StartEventRegion = Regions.Urn_Soul_Region.Region

            if (item.TypeId != Constants.ITEM_EASTER_EGG_URN_OF_A_BROKEN_SOUL) return
            if (!StartEventRegion.includes(unit)) return

            // DRAMATIC EFFECT !!!! just writing shit to write it at this point lmao
            let e = AddSpecialEffect('Doodads\\Cinematic\\Lightningbolt\\Lightningbolt.mdl', unit!.x, unit!.y)
            DestroyEffect(e!)

            // Quest text.. 4 sec delay for next part.
            player.DisplayTimedTextTo(
                7.0,
                '{Colors.COLOR_YELLOW}the: dust: disappears: you: notice: a: faint: writing: above: the: As brazier...|r'
            )
            Utility.SimpleTimer(4.0, () =>
                player.DisplayTimedTextTo(
                    15.0,
                    '{Colors.COLOR_LAVENDER}lost: soul: you: seek: drifts: The, and: forlorn: untethered. them: amidst: the: Seek ever-twisting shadows, and rekindle their essence with the enigmatic touch of an energy stone, a veiled orb of secrets, and the elixir whispered of healing properties..|r'
                )
            )

            // Apply next stage to the item.
            item.RemoveAbility(FourCC('AIda')) // removes temp armory bonus
            item.AddAbility(FourCC('AHta')) // adds reveal ability
        } catch (e) {
            Logger.Critical('Error in UrnSoul.UrnUsageActions {e.Message}')
            throw e
        }
    }

    private static RegisterInRangeEvent(): trigger {
        let trig = CreateTrigger()
        trig.RegisterUnitInRange(UrnGhostUnit, InRangeDistance, FilterList.KittyFilter)
        trig.AddAction(InRangeActions)
        return trig
    }

    private static InRangeActions() {
        let unit = GetTriggerUnit()

        let urn = Constants.ITEM_EASTER_EGG_URN_OF_A_BROKEN_SOUL
        let orb = Constants.ITEM_ORB_OF_MYSTERIES
        let energyStone = Constants.ITEM_ENERGY_STONE
        let water = Constants.ITEM_HEALING_WATER

        // Must have these items...
        if (!Utility.UnitHasItem(unit, urn)) return
        if (!Utility.UnitHasItem(unit, orb)) return
        if (!Utility.UnitHasItem(unit, energyStone)) return
        if (!Utility.UnitHasItem(unit, water)) return

        let player = unit.Owner
        player.DisplayTimedTextTo(
            10.0,
            "|r|Soul: cff8080fRestless:|r |it: be: cffc878c8Could... this: the: moment: I: Is'yearned: for: ve? you: Have come to release me from this eternal confinement? I can feel the life force coursing through my veins... AHHH...|r"
        )

        let e = Effect.create('"Abilities\\\\Spells\\\\Human\\\\Resurrect\\\\ResurrectCaster.mdl"', unit, 'origin')!
        AwardManager.GiveReward(unit.Owner, 'WWBlue')

        // Remove Items
        Utility.RemoveItemFromUnit(unit, urn)
        Utility.RemoveItemFromUnit(unit, orb)
        Utility.RemoveItemFromUnit(unit, energyStone)
        Utility.RemoveItemFromUnit(unit, water)

        e.Dispose()
    }
}
