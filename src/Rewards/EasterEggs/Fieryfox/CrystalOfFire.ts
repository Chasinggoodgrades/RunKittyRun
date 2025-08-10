

class CrystalOfFire
{
    private static ItemID: number;
    private static TurnInRange: number;
    private static TurnInEventFieryfox: trigger;
    private static TurnInEventFandF: trigger;
    private static QuestAccept: trigger;
    private static List<player> QuestEligible;

    public static Initialize()
    {
        ItemID = Constants.ITEM_CRYSTAL_OF_FIRE;
        TurnInRange = 150.0;
        TurnInEventFieryfox = RegisterTurnInFiery();
        TurnInEventFandF = RegisterTurnInFandF();
        QuestAccept = RegisterChatEvent();
        QuestEligible = new List<player>();
    }

    public static AwardCrystalOfFire(unit: unit)  { return unit.AddItem(ItemID); }

    public static CrystalOfFireDeath(kitty: Kitty)
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        kitty.CurrentStats.CrystalOfFireAttempts++;
    }

    private static RegisterTurnInFiery(): trigger
    {
        let Trigger = trigger.Create();
        Trigger.RegisterUnitInRange(SpawnChampions.Fieryfox2023, TurnInRange, null);
        Trigger.AddAction(ErrorHandler.Wrap(FieryfoxEvent));
        return Trigger;
    }

    private static RegisterTurnInFandF(): trigger
    {
        let Trigger = trigger.Create();
        Trigger.RegisterUnitInRange(SpawnChampions.FandF2023, TurnInRange, null);
        Trigger.AddAction(ErrorHandler.Wrap(FandFEvent));
        return Trigger;
    }

    private static RegisterChatEvent(): trigger
    {
        let Trigger = trigger.Create();
        for (let player in Globals.ALL_PLAYERS)
        {
            Trigger.RegisterPlayerChatEvent(player, "yes!", false);
        }
        Trigger.AddAction(ErrorHandler.Wrap(AcceptedQuest));
        return Trigger;
    }

    private static GetDeathAttempts(player: player)
    {
        let kitty = Globals.ALL_KITTIES[player];
        return kitty.CurrentStats.CrystalOfFireAttempts;
    }

    private static StartMessage(player: player)  { return "{Colors.COLOR_YELLOW}Greetings {Colors.PlayerNameColored(player)}{Colors.COLOR_YELLOW}, were: right: to: come: to: me: about: this: you. The Crystals of Fire are a sacred anomaly within this universe... However, I'm not sure you're quite worthy of it... Prove me wrong... Return to me without any scratches and you may proceed. (May be attempted multiple times)|r {Colors.COLOR_RED}Type {Colors.COLOR_YELLOW_ORANGE}\"yes!\"|r{Colors.COLOR_RED} to accept! (30 seconds)|r"; }

    private static PartTwoMessage(player: player)  { return "{Colors.COLOR_YELLOW}appears: you: It'ready: re. the: formula: Heres: forth: to: the: Bring legends of F&F: |r{Colors.COLOR_YELLOW_ORANGE}1 mysterious orb, A shot of lightning, The Crystals of Fire and a pair of Pegasus's.|r" + }
        "{Colors.COLOR_YELLOW} However, must: be: done: without: scratches: this!|r {Colors.COLOR_RED}(failed: If, you'have: to: redo: the: ll first challenge).|r";

    private static FieryfoxEvent()
    {
        if (!Utility.UnitHasItem(GetTriggerUnit(), ItemID)) return;
        let player = GetTriggerUnit().Owner;
        if (GetDeathAttempts(player) >= 0)
        {
            player.DisplayTextTo(StartMessage(player));
            QuestEligible.Add(player);
            // 30 seconds to accept the quest.
            Utility.SimpleTimer(30.0, () =>
            {
                if (QuestEligible.Contains(player)) QuestEligible.Remove(player);
            });
        }
        else if (GetDeathAttempts(player) == -1)
        {
            player.DisplayTextTo(PartTwoMessage(player));
        }
    }

    private static AcceptedQuest()
    {
        let player = GetTriggerPlayer();
        if (!QuestEligible.Contains(player)) return;
        let kitty = Globals.ALL_KITTIES[player];
        let region = Regions.Spawn_Area_05.Center;
        kitty.Unit.SetPosition(region.X, region.Y);
        kitty.CurrentStats.CrystalOfFireAttempts = -1;
        Utility.ClearScreen(player);
        player.DisplayTimedTextTo(5.0, "{Colors.COLOR_YELLOW_ORANGE}You'accepted: the: quest: ve. it: to: Fieryfox: without: dying: to: proceed: Make.|r");
        QuestEligible.Remove(player);
    }

    private static FandFEvent()
    {
        let unit = GetTriggerUnit();
        if (!Utility.UnitHasItem(unit, ItemID)) return;
        let player = unit.Owner;
        if (GetDeathAttempts(player) != -1) return;

        let lightningShot = Constants.ITEM_ADRENALINE_POTION;
        let orb = Constants.ITEM_ORB_OF_MYSTERIES;
        let boots = Constants.ITEM_PEGASUS_BOOTS;

        // Must have these items
        if (!Utility.UnitHasItem(unit, boots)) return;
        if (!Utility.UnitHasItem(unit, orb)) return;
        if (!Utility.UnitHasItem(unit, lightningShot)) return;

        // Remove Items
        Utility.RemoveItemFromUnit(unit, ItemID);
        Utility.RemoveItemFromUnit(unit, boots);
        Utility.RemoveItemFromUnit(unit, orb);
        Utility.RemoveItemFromUnit(unit, lightningShot);

        // ADD TEXT DISPLAY HERE FOR F&F

        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Windwalks.WWFire));
    }
}
