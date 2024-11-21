using static WCSharp.Api.Common;
using WCSharp.Api;

public class ShardOfTranslocation : Relic
{
    public const int RelicItemID = Constants.ITEM_SHARD_OF_TRANSLOCATION;
    private static float EXTRA_REVIVE_CHANCE_SINGLE = 0.125f; // 12.5%
    private static float EXTRA_REVIVE_CHANCE_ALL = 0.02f; // 2%
    private static float MaxBlinkRange = 600.0f;
    private static new string IconPath = "ReplaceableTextures/CommandButtons/BTNShardOfTranslocation.blp";
    private const int RelicCost = 650;

    public ShardOfTranslocation() : base(
        "|c7eb66ff1Shard of Translocation|r",
        $"Teleports the user to a targeted location within {MaxBlinkRange} range, restricted to lane bounds.{Colors.COLOR_ORANGE}(Active)|r",
        RelicItemID,
        RelicCost,
        IconPath
        )
    { }

    public override void ApplyEffect(unit Unit)
    {

    }

    public override void RemoveEffect(unit Unit)
    {

    }

}