using System;
using WCSharp.Api;

public static class SpawnChampions
{
    public static unit Fieryfox2023;
    public static unit Fieryfox2024;
    public static unit FandF2023;
    public static unit Stan2025;

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        SpawnUnits();
        ApplyCosmetics();
    }

    private static void SpawnUnits()
    {
        var rect = Regions.Solo2023.Rect;
        var x = rect.CenterX;
        var y = rect.CenterY;
        Fieryfox2023 = unit.Create(player.NeutralPassive, Constants.UNIT_SOLO_TOURNAMENT_2023, x, y, 135.0f);

        rect = Regions.Team2023.Rect;
        x = rect.CenterX;
        y = rect.CenterY;
        FandF2023 = unit.Create(player.NeutralPassive, Constants.UNIT_TEAM_TOURNAMENT_2023, x, y, 45.0f);

        rect = Regions.Solo2024.Rect;
        x = rect.CenterX;
        y = rect.CenterY;
        Fieryfox2024 = unit.Create(player.NeutralPassive, Constants.UNIT_SOLO_TOURNAMENT_2024, x, y, 315.0f);

        rect = Regions.UrnSoulRegion1.Rect;
        x = rect.CenterX;
        y = rect.CenterY;
        Stan2025 = unit.Create(player.NeutralPassive, Constants.UNIT_SOLO_TOURNAMENT_2025, x, y, 230.0f);
    }

    private static void ApplyCosmetics()
    {
        Fieryfox2023.AddSpecialEffect("war3mapImported\\NitroTurquoise.mdx", "origin");
        Fieryfox2023.AddSpecialEffect("war3mapImported\\TurquoiseWings.mdx", "chest");

        FandF2023.AddSpecialEffect("war3mapImported\\GlaciarAuraPurple.mdx", "origin");
        FandF2023.AddSpecialEffect("war3mapImported\\VoidTendrilsWings.mdx", "chest");

        Fieryfox2024.AddSpecialEffect("war3mapImported\\NitroTurquoise.mdx", "origin");
        Fieryfox2024.AddSpecialEffect("war3mapImported\\TurquoiseWings.mdx", "chest");

        Stan2025.AddSpecialEffect("war3mapImported\\VoidTendrilsWings.mdx", "chest");
        Stan2025.AddSpecialEffect("war3mapImported\\NitroTurquoise.mdx", "origin");
    }
}