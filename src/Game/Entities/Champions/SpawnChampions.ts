class SpawnChampions {
    public static Fieryfox2023: unit
    public static Fieryfox2024: unit
    public static FandF2023: unit
    public static Stan2025: unit

    public static Initialize() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        SpawnUnits()
        ApplyCosmetics()
    }

    private static SpawnUnits() {
        let rect = Regions.Solo2023.Rect
        let x = rect.CenterX
        let y = rect.CenterY
        Fieryfox2023 = unit.Create(player.NeutralPassive, Constants.UNIT_SOLO_TOURNAMENT_2023, x, y, 135.0)
        Fieryfox2023.IsInvulnerable = true

        rect = Regions.Team2023.Rect
        x = rect.CenterX
        y = rect.CenterY
        FandF2023 = unit.Create(player.NeutralPassive, Constants.UNIT_TEAM_TOURNAMENT_2023, x, y, 45.0)
        FandF2023.IsInvulnerable = true

        rect = Regions.Solo2024.Rect
        x = rect.CenterX
        y = rect.CenterY
        Fieryfox2024 = unit.Create(player.NeutralPassive, Constants.UNIT_SOLO_TOURNAMENT_2024, x, y, 315.0)
        Fieryfox2024.IsInvulnerable = true

        rect = Regions.UrnSoulRegion1.Rect
        x = rect.CenterX
        y = rect.CenterY
        Stan2025 = unit.Create(player.NeutralPassive, Constants.UNIT_SOLO_TOURNAMENT_2025, x, y, 230.0)
        Stan2025.IsInvulnerable = true
    }

    private static ApplyCosmetics() {
        Fieryfox2023.AddSpecialEffect('war3mapImported\\NitroTurquoise.mdx', 'origin')
        Fieryfox2023.AddSpecialEffect('war3mapImported\\TurquoiseWings.mdx', 'chest')

        FandF2023.AddSpecialEffect('war3mapImported\\GlaciarAuraPurple.mdx', 'origin')
        FandF2023.AddSpecialEffect('war3mapImported\\VoidTendrilsWings.mdx', 'chest')

        Fieryfox2024.AddSpecialEffect('war3mapImported\\NitroTurquoise.mdx', 'origin')
        Fieryfox2024.AddSpecialEffect('war3mapImported\\TurquoiseWings.mdx', 'chest')

        Stan2025.AddSpecialEffect('war3mapImported\\VoidTendrilsWings.mdx', 'chest')
        Stan2025.AddSpecialEffect('war3mapImported\\NitroTurquoise.mdx', 'origin')
    }
}
