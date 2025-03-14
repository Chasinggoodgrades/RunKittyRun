using System.Collections.Generic;
using WCSharp.Api;
public static class CrystalOfFire
{
    private static int ItemID;
    private static float TurnInRange;
    private static trigger TurnInEventFieryfox;
    private static trigger TurnInEventFandF;
    private static trigger QuestAccept;
    private static Dictionary<player, int> DeathAttempts;
    private static List<player> QuestEligible;

    public static void Initialize()
    {
        ItemID = Constants.ITEM_CRYSTAL_OF_FIRE;
        TurnInRange = 150.0f;
        TurnInEventFieryfox = RegisterTurnInFiery();
        TurnInEventFandF = RegisterTurnInFandF();
        QuestAccept = RegisterChatEvent();
        DeathAttempts = new Dictionary<player, int>();
        QuestEligible = new List<player>();
    }

    public static void AwardCrystalOfFire(unit unit) => unit.AddItem(ItemID);

    public static void CrystalOfFireDeath(Kitty kitty)
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        if (!DeathAttempts.ContainsKey(kitty.Player)) return;
        DeathAttempts[kitty.Player]++;
    }

    private static trigger RegisterTurnInFiery()
    {
        var Trigger = trigger.Create();
        Trigger.RegisterUnitInRange(SpawnChampions.Fieryfox2023, TurnInRange, null);
        Trigger.AddAction(FieryfoxEvent);
        return Trigger;
    }

    private static trigger RegisterTurnInFandF()
    {
        var Trigger = trigger.Create();
        Trigger.RegisterUnitInRange(SpawnChampions.FandF2023, TurnInRange, null);
        Trigger.AddAction(FandFEvent);
        return Trigger;
    }

    private static trigger RegisterChatEvent()
    {
        var Trigger = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
        {
            Trigger.RegisterPlayerChatEvent(player, "yes!", false);
        }
        Trigger.AddAction(AcceptedQuest);
        return Trigger;
    }

    private static int GetDeathAttempts(player player)
    {
        if (DeathAttempts.TryGetValue(player, out var attempts) == false)
        {
            DeathAttempts[player] = 0;
            return 0;
        }
        return attempts;
    }

    private static string StartMessage(player player) => $"{Colors.COLOR_YELLOW}Greetings {Colors.PlayerNameColored(player)}{Colors.COLOR_YELLOW}, you were right to come to me about this. The Crystals of Fire are a sacred anomaly within this universe... However, I'm not sure you're quite worthy of it... Prove me wrong... Return to me without any scratches and you may proceed. (May be attempted multiple times)|r {Colors.COLOR_RED}Type {Colors.COLOR_YELLOW_ORANGE}\"yes!\"|r{Colors.COLOR_RED} to accept! (30 seconds)|r";
    private static string PartTwoMessage(player player) => $"{Colors.COLOR_YELLOW}It appears you're ready. Heres the formula: Bring forth to the legends of F&F: |r{Colors.COLOR_YELLOW_ORANGE}1 mysterious orb, A shot of lightning, The Crystals of Fire and a pair of Pegasus's.|r" +
        $"{Colors.COLOR_YELLOW} However, this must be done without scratches!|r {Colors.COLOR_RED}(If failed, you'll have to redo the first challenge).|r";
    private static void FieryfoxEvent()
    {
        if (!Utility.UnitHasItem(@event.Unit, ItemID)) return;
        var player = @event.Unit.Owner;
        if (GetDeathAttempts(player) >= 0)
        {
            player.DisplayTextTo(StartMessage(player));
            QuestEligible.Add(player);
            // 30 seconds to accept the quest.
            Utility.SimpleTimer(30.0f, () =>
            {
                if (QuestEligible.Contains(player)) QuestEligible.Remove(player);
            });
        }
        else if (GetDeathAttempts(player) == -1)
        {
            player.DisplayTextTo(PartTwoMessage(player));
        }
    }

    private static void AcceptedQuest()
    {
        var player = @event.Player;
        if (!QuestEligible.Contains(player)) return;
        var kitty = Globals.ALL_KITTIES[player].Unit;
        var region = Regions.Spawn_Area_05.Center;
        kitty.SetPosition(region.X, region.Y);
        DeathAttempts[player] = -1;
        Utility.ClearScreen(player);
        player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}You've accepted the quest. Make it to Fieryfox without dying to proceed.|r");
        QuestEligible.Remove(player);
    }

    private static void FandFEvent()
    {
        var unit = @event.Unit;
        if (!Utility.UnitHasItem(unit, ItemID)) return;
        var player = unit.Owner;
        if (GetDeathAttempts(player) != -1) return;

        var lightningShot = Constants.ITEM_ADRENALINE_POTION;
        var orb = Constants.ITEM_ORB_OF_MYSTERIES;
        var boots = Constants.ITEM_PEGASUS_BOOTS;

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