using static WCSharp.Api.Common;
using WCSharp.Api;
public static class Challenges
{
    public const int DIVINITY_TENDRILS_COUNT = 4;
    public static void Initialize()
    {
        Deathless.Initialize();
        Nitros.Initialize();
    }

    public static void ButterflyAura(player player)
    {
        if (Difficulty.DifficultyValue != (int)DifficultyLevel.Impossible) return;
        AwardManager.GiveReward(player, Awards.Butterfly_Aura);
    }

    public static void WhiteTendrils() => AwardManager.GiveRewardAll(Awards.White_Tendrils);

    public static void DivinityTendrils(player player) => AwardManager.GiveReward(player, Awards.Divinity_Tendrils);

    public static void NecroWindwalk() => AwardManager.GiveRewardAll(Awards.WW_Necro);
}