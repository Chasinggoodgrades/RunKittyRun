using WCSharp.Api;
using static WCSharp.Api.Common;

public static class FandF
{
    private const int EmptyVial = Constants.ITEM_EASTER_EGG_EMPTY_VIAL;
    private const int BloodVial = Constants.ITEM_EASTER_EGG_BLOOD_FILLED_VIAL;
    private static float TurnInRange { get; set; }
    private static float CollectionRange { get; set; }
    private static trigger InRangeTrigger;
    private static trigger CollectionTrigger;
    public static unit BloodWolf { get; private set; }

    public static void Initialize()
    {
        TurnInRange = 150.0f;
        CollectionRange = 100.0f;
        InRangeTrigger = RegisterTurnIn();
        CollectionTrigger = RegisterCollection();
    }

    public static void CreateBloodWolf()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        var region = GetRandomInt(0, WolfArea.WolfAreas.Count - 1);
        var wolfObject = new Wolf(region);
        BloodWolf = wolfObject.Unit;
        BloodWolf.Name = "|cffffffff?|r|cffffcccc?|r|cffff9999?|r|cffff6666?|r|cffff3333?|r|cffff0000?|r";
        BloodWolf.SetVertexColor(100, 50, 50);
        AppendCollectionsUnit();
    }

    private static void AppendCollectionsUnit()
    {
        CollectionTrigger.RegisterUnitInRange(BloodWolf, CollectionRange, Filters.KittyFilter);
    }

    private static trigger RegisterCollection()
    {
        var trig = trigger.Create();
        trig.AddAction(CollectionActions);
        return trig;
    }

    private static void CollectionActions()
    {
        var unit = @event.Unit;

        if (!Utility.UnitHasItem(unit, EmptyVial)) return;

        // Otherwise .. they have item.. Give them blood filled vial.
        Utility.RemoveItemFromUnit(unit, EmptyVial);
        unit.AddItem(BloodVial);
    }

    private static trigger RegisterTurnIn()
    {
        var trig = trigger.Create();
        trig.RegisterUnitInRange(SpawnChampions.FandF2023, TurnInRange, Filters.KittyFilter);
        trig.AddAction(TurnInActions);
        return trig;
    }

    private static void TurnInActions()
    {
        EmptyVialQuest(@event.Unit);
        BloodVialQuest(@event.Unit);
    }

    private static void EmptyVialQuest(unit u)
    {
        if (!Utility.UnitHasItem(u, EmptyVial)) return;
        var player = u.Owner;
        player.DisplayTimedTextTo(20.0f,
            "|cff00ffffFast & Furriest:|r |cffffff00Greetings, fellow feline! What paws you hold there? An empty vial, eh? A predecessor's unfinished tale, it seems. In my wanderings, a wolf unlike any other crossed my path. Its blood holds mysteries.. Grab me a sample. Hurry, this beast tends to wander. |r");

    }

    private static void BloodVialQuest(unit u)
    {
        if (!Utility.UnitHasItem(u, BloodVial)) return;

        if (BloodVialItems(u))
        {
            RemoveQuestItems(u);
            AwardManager.GiveReward(u.Owner, nameof(Globals.GAME_AWARDS_SORTED.Windwalks.WWBlood));
        }
        else u.Owner.DisplayTimedTextTo(20.0f,
            "|cff00ffffFast & Furriest:| r |cffffff00Ah, splendid! You've recovered the sample. Your prowess is truly remarkable. Evidently, the potential within this sample can be exponentially amplified. Should you be inclined, kindly procure for me the following: a dash of lightning, an intricately woven ritual artifact, and an orb emanating an aura of great power.|r");
    }

    private static bool BloodVialItems(unit u)
    {
        return Utility.UnitHasItem(u, Constants.ITEM_ADRENALINE_POTION) && Utility.UnitHasItem(u, Constants.ITEM_RITUAL_MASK) && Utility.UnitHasItem(u, Constants.ITEM_ORB_OF_MYSTERIES) && Utility.UnitHasItem(u, BloodVial);
    }

    private static void RemoveQuestItems(unit u)
    {
        Utility.RemoveItemFromUnit(u, BloodVial);
        Utility.RemoveItemFromUnit(u, Constants.ITEM_ADRENALINE_POTION);
        Utility.RemoveItemFromUnit(u, Constants.ITEM_RITUAL_MASK);
        Utility.RemoveItemFromUnit(u, Constants.ITEM_ORB_OF_MYSTERIES);
    }
}
