using System.Collections.Generic;

/// <summary>
/// Maps every reward's system name to its color-coded display name and description,
/// sourced directly from the WTS string table (war3map.wts).
/// Call <see cref="Configure"/> once after <see cref="RewardCreation.SetupRewards"/>.
/// </summary>
public static class RewardDisplayData
{
    public static void Configure(List<Reward> rewards)
    {
        for (var i = 0; i < rewards.Count; i++)
            Apply(rewards[i]);
    }

    private static void Apply(Reward reward)
    {
        switch (reward.SystemRewardName())
        {
            // ## Hats ##########################################################
            case nameof(Hats.Bandana):
                reward.WithDisplay("|cffff0000Bandana|r", "Obtained by reaching |cffffff00200|r saves.");
                break;
            case nameof(Hats.PirateHat):
                reward.WithDisplay("|cffa56f34Pirate Hat|r", "Obtained by reaching |cffffff00250|r saves.");
                break;
            case nameof(Hats.ChefHat):
                reward.WithDisplay("Chef Hat", "Obtained by reaching |cffffff00300|r saves.");
                break;
            case nameof(Hats.TikiMask):
                reward.WithDisplay("|cff8a2be2Tiki Headress|r", "Obtained by reaching |cffffff00350|r saves.");
                break;
            case nameof(Hats.SamuraiHelm):
                reward.WithDisplay("|cff696969Samuari Mask|r", "Obtained by reaching |cffffff00400|r saves.");
                break;
            case nameof(Hats.SantaHat):
                reward.WithDisplay("|cffff0000Santa Hat|r", "Obtained by reaching |cffffff00800|r saves.");
                break;

            // ## Auras ##########################################################
            case nameof(Auras.SpecialAura):
                reward.WithDisplay("|cff00c8c8Special Aura|r", "Obtained by getting |cffff00005 Hard+|r wins.");
                break;
            case nameof(Auras.StarlightAura):
                reward.WithDisplay("|cffff00ffStarlight Aura|r", "Obtained by playing atleast |cffffff0065 Normal+|r games.");
                break;
            case nameof(Auras.SpectacularAura):
                reward.WithDisplay("|cff8080ffSpectacular Aura|r", "Obtained by getting |cffffff0030 Normal+|r wins.");
                break;
            case nameof(Auras.ManaAura):
                reward.WithDisplay("|cff00b4faMana Aura|r", "Obtained by getting |cffffff0020 Normal+|r wins.");
                break;
            case nameof(Auras.ButterflyAura):
                reward.WithDisplay("|cff80ff80Butterfly Aura|r", "Obtained by beating the |cffffff00Round 4|r nitro on |cff960000Impossible+|r with 5 or less deaths.");
                break;
            case nameof(Auras.FreezeAura):
                reward.WithDisplay("|cff82a0ffFrozen Aura|r", "Using the |cff8080ffFrostbite Ring|r, collectively freeze a total of 50 wolves in a single game and win on |cffffff00Normal+|r.");
                break;
            case nameof(Auras.ChainedNormalAura):
                reward.WithDisplay("|cff00ff00Chained Aura Normal|r", "Obtained by beating the Chained Together Event on |cffffff00Normal+|r.");
                break;
            case nameof(Auras.ChainedHardAura):
                reward.WithDisplay("|cffffff00Chained Aura Hard|r", "Obtained by beating the Chained Together Event on |cffff0000Hard+|r.");
                break;
            case nameof(Auras.ChainedImpossibleAura):
                reward.WithDisplay("|cffff0000Chained Aura Impossible|r", "Obtained by beating the Chained Together Event on |cff960000Impossible+|r.");
                break;
            case nameof(Auras.ChainedNightmareAura):
                reward.WithDisplay("|cffff00ffChained Aura Nightmare|r", "Obtained by beating the Chained Together Event on |cffff00ffNightmare|r.");
                break;
            case nameof(Auras.TemperedAura):
                reward.WithDisplay("|cffe4e4e4Tempered Aura|r", $"Obtained by collectively gathering {Challenges.TEMPERED_AURA_KIBBLE_REQUIREMENT} kibble and then winning the game on |cff960000Impossible+|r during the Pre-League Season.");
                break;

            // ## Wings ##########################################################
            case nameof(Wings.PhoenixWings):
                reward.WithDisplay("|cffff6347Phoenix Wings|r", "Obtained by reaching |cffffff00375|r saves.");
                break;
            case nameof(Wings.FairyWings):
                reward.WithDisplay("|cff66ccffFairy|r |cffcc66ffWings|r", "Obtained by reaching |cffffff00275|r saves.");
                break;
            case nameof(Wings.NightmareWings):
                reward.WithDisplay("|cffff4500Nightmare Wings|r", "Obtained by reaching |cffffff00325|r saves.");
                break;
            case nameof(Wings.ArchangelWings):
                reward.WithDisplay("|cffffd700Archangel Wings|r", "Obtained by reaching |cffffff00425|r saves.");
                break;
            case nameof(Wings.CosmicWings):
                reward.WithDisplay("|cff8a2be2Cosmic Wings|r", "Obtained by reaching |cffffff00550|r saves.");
                break;
            case nameof(Wings.VoidWings):
                reward.WithDisplay("|cff3287ffVoid Wings|r", "Obtained by reaching |cffffff00500|r saves.");
                break;
            case nameof(Wings.ChaosWings):
                reward.WithDisplay("|cffc71585Chaos Wings|r", "Obtained by reaching |cffffff00450|r saves.");
                break;
            case nameof(Wings.PinkWings):
                reward.WithDisplay("|cffff1493Pink Wings|r", "Obtained by reaching |cffffff00600|r saves.");
                break;
            case nameof(Wings.NatureWings):
                reward.WithDisplay("|cff32cd32Nature Wings|r", "Obtained by reaching |cffffff00750|r saves.");
                break;
            case nameof(Wings.RedTendrils):
                reward.WithDisplay("|cffdc143cRed Tendrils|r", "Obtained by returning |cffff0000Fieryfox|r his missing shoe.");
                break;
            case nameof(Wings.WhiteTendrils):
                reward.WithDisplay("White Tendrils", "Obtained by simply winning the game on |cff960000Impossible|r difficulty.");
                break;
            case nameof(Wings.DivinityTendrils):
                reward.WithDisplay("|cfffae100Divinity Tendrils|r", "Obtained by getting |cffffff004|r revives using your ultimate's AoE effect.");
                break;
            case nameof(Wings.GreenTendrils):
                reward.WithDisplay("|cff32cd32Green Tendrils|r", "Obtained by purchasing from the shop.");
                break;
            case nameof(Wings.PatrioticTendrils):
                reward.WithDisplay(
                    "|cfffa3232P|r|cffef3540a|r|cffe4394et|r|cffda3c5dr|r|cffcf406bi|r|cffc4437ao|r|cffba4789t|r|cffaf4a97i|r|cffa54ea6c|r|cff9a51b4 |r|cff8f55c3W|r|cff8459d2i|r|cff7a5ce0n|r|cff6f60eeg|r|cff6463fes|r",
                    "Obtained by reaching a save streak of |cffffff0050|r without dying.");
                break;
            case nameof(Wings.SnowWings2023):
                reward.WithDisplay("|cff809effSnowy Wings|r", "Obtained by playing this map during the Christmas holidays :)");
                break;

            // ## Trails ##########################################################
            case nameof(Trails.PurpleFire):
                reward.WithDisplay("|cffc832ffPurple Fire|r", "Obtained by beating |cffffff00Round 2|r on |cff960000Impossible|r with |cffffff000|r deaths.");
                break;
            case nameof(Trails.BlueFire):
                reward.WithDisplay("|cff8080ffBlue Fire|r", "Obtained by winning the game on |cffffff00Normal+|r with less than |cffffff0025|r total deaths.");
                break;
            case nameof(Trails.TurquoiseFire):
                reward.WithDisplay("|cff40d8ceTurquoise Fire|r", "Obtained by beating |cffffff00Round 5|r on |cffffff00Normal+|r with |cffffff0010 or less|r round deaths.");
                break;
            case nameof(Trails.PinkFire):
                reward.WithDisplay("|cffff00ffPink Fire|r", "Obtained by winning a |cffffff00Normal+|r game with a |cffffff003:1|r Ratio or better.");
                break;
            case nameof(Trails.WhiteFire):
                reward.WithDisplay("White Fire", "Obtained by beating |cffffff00Round 3|r nitro on |cffffff00Normal+|r with |cffffff003 or less|r deaths.");
                break;
            case nameof(Trails.BlueLightning):
                reward.WithDisplay("|cff8080ffBlue Lightning!|r", "Obtained by reaching |cffffff002000|r saves.");
                break;
            case nameof(Trails.RedLightning):
                reward.WithDisplay("|cffff0000Red Lightning|r", "Obtained by reaching a save streak of |cffffff0015|r without dying.");
                break;
            case nameof(Trails.PurpleLightning):
                reward.WithDisplay("|cff6f2583Purple Lightning|r", "Obtained by getting |cffffff00175|r saves within one game.");
                break;
            case nameof(Trails.YellowLightning):
                reward.WithDisplay("|cffffff00Yellow Lightning|r", "Obtained by getting |cffffff006|r saves within |cffffff003 seconds|r.");
                break;
            case nameof(Trails.GreenLightning):
                reward.WithDisplay("|cff00ff00Green Lightning|r", "Obtained by finishing a round with a save streak of |cffffff0010|r and |cffffff000|r deaths.");
                break;
            case nameof(Trails.SnowTrail2023):
                reward.WithDisplay("|cff6c9effSnow Trail|r", "Obtained by playing this map during the Christmas holidays :)");
                break;

            // ## Nitros ##########################################################
            case nameof(Nitros.Nitro):
                reward.WithDisplay("|cff8080ffNitro|r", "Obtained by beating the |cffffff00Round 1|r nitro timer.");
                break;
            case nameof(Nitros.NitroBlue):
                reward.WithDisplay("|cff0064ffNitro Blue|r", "Obtained by beating the |cffffff00Round 2|r nitro timer.");
                break;
            case nameof(Nitros.NitroRed):
                reward.WithDisplay("|cffff0000Nitro Red|r", "Obtained by beating the |cffffff00Round 3|r nitro timer.");
                break;
            case nameof(Nitros.NitroGreen):
                reward.WithDisplay("|cff00ff00Nitro Green|r", "Obtained by beating the |cffffff00Round 4|r nitro timer.");
                break;
            case nameof(Nitros.NitroPurple):
                reward.WithDisplay("|cff6f2583Nitro Purple|r", "Obtained by beating the |cffffff00Round 5|r nitro timer.");
                break;
            case nameof(Nitros.DivineLight):
                reward.WithDisplay("|cffe1e100Divine Light|r", "Obtained by beating the nitro timer for |cffffff00ALL|r rounds in a single game OR |cffffff00Round 1|r |cff800000Impossible+|r.");
                break;
            case nameof(Nitros.AzureLight):
                reward.WithDisplay("|cff57aaffAzure Light|r", "Obtained by beating the nitro timer on |cffffff00Round 2|r |cff800000Impossible+|r.");
                break;
            case nameof(Nitros.CrimsonLight):
                reward.WithDisplay("|cffff4a4aCrimson Light|r", "Obtained by beating the nitro timer on |cffffff00Round 3|r |cff800000Impossible+|r.");
                break;
            case nameof(Nitros.EmeraldLight):
                reward.WithDisplay("|cff80ff80Emerald Light|r", "Obtained by beating the nitro timer on |cffffff00Round 4|r |cff800000Impossible+|r.");
                break;
            case nameof(Nitros.VioletLight):
                reward.WithDisplay("|cff826edcViolet Light|r", "Obtained by beating the nitro timer on |cffffff00Round 5|r |cff800000Impossible+|r.");
                break;
            case nameof(Nitros.PatrioticLight):
                reward.WithDisplay(
                    "|cffff0000P|r|cffed0711a|r|cffdb0e23t|r|cffc91535r|r|cffb71c47i|r|cffa4235ao|r|cff922a6ct|r|cff80317ei|r|cff6e3890c|r|cff5c3fa2 |r|cff4947b5L|r|cff374ec7i|r|cff2555d9g|r|cff135cebh|r|cff0063fet|r",
                    "Obtained by reaching the end for Round 5 on |cff800000Impossible|r difficulty in under |cffffff0016 minutes and 35 seconds|r of total game time.");
                break;

            // ## Windwalks ##########################################################
            case nameof(Windwalks.WWBlood):
                reward.WithDisplay("|cffc80000Blood Windwalk|r", "Obtained by completing the Blood Vial easter egg.");
                break;
            case nameof(Windwalks.WWBlue):
                reward.WithDisplay("|cff0096c8Bluesoul Windwalk|r", "Obtained by completing the Urn of a Broken Soul easter egg.");
                break;
            case nameof(Windwalks.WWFire):
                reward.WithDisplay("|cffffaa1eFire Windwalk|r", "Obtained by completeing the Crystal of Fire easter egg.");
                break;
            case nameof(Windwalks.WWNecro):
                reward.WithDisplay("|cff78fa5aNecro Windwalk|r", "Obtained by winning the game in under 25 mins.");
                break;
            case nameof(Windwalks.WWSwift):
                reward.WithDisplay("|cffdcdcffSwift Windwalk|r", "Obtained by completing the Cat Figurine easter egg.");
                break;
            case nameof(Windwalks.WWDivine):
                reward.WithDisplay("|cffffff00Divine Windwalk|r", "Obtained by reaching the limit.. only to retrace your journey.");
                break;
            case nameof(Windwalks.WWViolet):
                reward.WithDisplay("|cffa150b5Violet Windwalk|r", "Obtained by ... ???");
                break;

            // ## Deathless ##########################################################
            case nameof(Deathless.NormalDeathless1):
                reward.WithDisplay("|cffd45e19Deathless Fire I|r", "Obtained by reaching all |cffffff0014 safezones|r on |cffffff00Normal|r for |cffffff00Round 1|r without dying.");
                break;
            case nameof(Deathless.NormalDeathless2):
                reward.WithDisplay("|cff008000Deathless Fire II|r", "Obtained by reaching all |cffffff0014 safezones|r on |cffffff00Normal|r for |cffffff00Round 2|r without dying.");
                break;
            case nameof(Deathless.NormalDeathless3):
                reward.WithDisplay("|cffffff00Deathless Fire III|r", "Obtained by reaching all |cffffff0014 safezones|r on |cffffff00Normal|r for |cffffff00Round 3|r without dying.");
                break;
            case nameof(Deathless.NormalDeathless4):
                reward.WithDisplay("|cffff0000Deathless Fire IV|r", "Obtained by reaching all |cffffff0014 safezones|r on |cffffff00Normal|r for |cffffff00Round 4|r without dying.");
                break;
            case nameof(Deathless.NormalDeathless5):
                reward.WithDisplay("|cff00ff00Deathless Fire V|r", "Obtained by reaching all |cffffff0014 safezones|r on |cffffff00Normal|r for |cffffff00Round 5|r without dying.");
                break;
            case nameof(Deathless.NormalTeamDeathless):
                reward.WithDisplay("|cffd47325Normal Team Deathless|r", "Obtained by completeing the team deathless challenge on |cffffff00Normal+|r.");
                break;
            case nameof(Deathless.HardTeamDeathless):
                reward.WithDisplay("|cffd47325Hard Team Deathless|r", "Obtained by completeing the team deathless challenge on |cffff0000Hard+|r.");
                break;
            case nameof(Deathless.ImpossibleTeamDeathless):
                reward.WithDisplay("|cff4e96ffImpossible Team Deathless|r", "Obtained by completeing the team deathless challenge on |cff960000Impossible|r.");
                break;

            // ## Skins ##########################################################
            case nameof(Skins.UndeadKitty):
                reward.WithDisplay("|cff404040Undead Kitty|r", "Obtained by getting |cffffff0030 Normal+|r wins.");
                break;
            case nameof(Skins.HighelfKitty):
                reward.WithDisplay("|cffd48c57Highelf Kitty|r", "Obtained by playing atleast |cffffff0040 Normal+|r games.");
                break;
            case nameof(Skins.AncientKitty):
                reward.WithDisplay("|cff008000Ancient Kitty|r", "Obtained by getting |cffffff0040 Normal+|r wins.");
                break;
            case nameof(Skins.SatyrKitty):
                reward.WithDisplay("|cffb15050Satyr Kitty|r", "Obtained by getting |cffffff0025 Normal+|r wins.");
                break;
            case nameof(Skins.AstralKitty):
                reward.WithDisplay("|cff466effAstral Kitty|r", "Obtained by playing atleast |cffffff0055 Normal+|r games.");
                break;
            case nameof(Skins.ZandalariKitty):
                reward.WithDisplay("|cffd48c19Zandalari Kitty|r", "Obtained by getting |cffffff00R4 Nitro|r then winning the game on |cffff0000Hard+|r difficulty.");
                break;
            case nameof(Skins.HuntressKitty):
                reward.WithDisplay("|cff80ff80Huntress|r", "Obtained by winning the kibble collection event!");
                break;

            // ## Tournament ##########################################################
            case nameof(Tournament.VioletAura):
                reward.WithDisplay("|cff9c5ac8Purple Runic Aura|r", "|cffd45e19[Team Tournament]|r |cff00ffffFast and Furriest|r");
                break;
            case nameof(Tournament.VioletWings):
                reward.WithDisplay("|cff9c5ac8Violet Tendrils|r", "|cffd45e19[Team Tournament]|r |cff00ffffFast and Furriest|r");
                break;
            case nameof(Tournament.TurquoiseWings):
                reward.WithDisplay("|cff00ffffTurquoise Wings|r", "|cffd45e19[Solo Tournament]|r |cffff0000Fieryfox|r");
                break;
            case nameof(Tournament.TurquoiseNitro):
                reward.WithDisplay("|cff30d5c8Nitro Turquoise|r", "|cffd45e19[Solo Tournament]|r |cffff0000Fieryfox|r");
                break;
            case nameof(Tournament.PenguinSkin):
                reward.WithDisplay("|cff8080ffPenguin!|r", "|cffd45e19[Solo Tournament]|r |cff6d4891MrGheed|r");
                break;
        }
    }
}
