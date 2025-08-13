export class Progress {
    public static DistancesFromStart: Map<number, number> = new Map()
    private static TeamProgTimer = Timer.create()

    public static Initialize() {
        CalculateTotalDistance()
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return
        TeamProgTimer.start(0.2, true, TeamProgressTracker)
    }

    public static CalculateProgress(kitty: Kitty) {
        let round = Globals.ROUND
        kitty.TimeProg.SetRoundProgress(round, CalculatePlayerProgress(kitty))
    }

    private static TeamProgressTracker() {
        if (!Globals.GAME_ACTIVE) return
        try {
            for (let i: number = 0; i < Globals.ALL_TEAMS_LIST.length; i++) {
                let team = Globals.ALL_TEAMS_LIST[i]
                team.UpdateRoundProgress(Globals.ROUND, CalculateTeamProgress(team))
            }
            TeamsMultiboard.UpdateTeamStatsMB()
        } catch (e: any) {
            Logger.Warning('Error in TeamProgressTracker. {e.Message}')
        }
    }

    private static CalculateTeamProgress(Team: Team) {
        let totalProgress: number = 0.0

        if (Team.Teammembers.length == 0) return '0.00'

        for (let i: number = 0; i < Team.Teammembers.length; i++) {
            let player = Team.Teammembers[i]
            totalProgress += Globals.ALL_KITTIES.get(player)!.TimeProg.GetRoundProgress(Globals.ROUND)
        }

        return (totalProgress / Team.Teammembers.length).ToString('F2')
    }

    private static CalculatePlayerProgress(kitty: Kitty) {
        try {
            let currentSafezone = kitty.ProgressZone
            if (Globals.SAFE_ZONES[Globals.SAFE_ZONES.length - 1].Rectangle.includes(kitty.Unit.x, kitty.Unit.y))
                return 100.0 // if at end.. 100 progress
            if (Regions.Victory_Area.includes(kitty.Unit.x, kitty.Unit.y)) return 100.0 // if in victory area, 100 progress
            if (Globals.SAFE_ZONES[0].Rectangle.includes(kitty.Unit.x, kitty.Unit.y) && !kitty.Finished) return 0.0 // if at start, 0 progress
            if (kitty.isAlive() && kitty.Finished) return 100.0
            let currentProgress = DistanceBetweenPoints(
                kitty.Unit.x,
                kitty.Unit.y,
                ProgressPointHelper.Points[kitty.ProgressHelper.CurrentPoint].x,
                ProgressPointHelper.Points[kitty.ProgressHelper.CurrentPoint].y
            )
            let totalProgress = DistancesFromStart[currentSafezone] + currentProgress

            let progress = (totalProgress / DistancesFromStart[RegionList.PathingPoints.length - 1]) * 100
            if (progress > 100) progress = 100.0

            return progress
        } catch (e: any) {
            Logger.Warning('Error in CalculatePlayerProgress. {e.Message}')
            return 0.0
        }
    }

    public static CalculateNitroPacerProgress(): number {
        let nitroKitty = NitroPacer.Unit
        let currentSafezone = NitroPacer.GetCurrentCheckpoint()
        if (Globals.SAFE_ZONES[0].Rectangle.includes(nitroKitty.x, nitroKitty.y)) return 0.0 // if at start, 0 progress
        if (Globals.SAFE_ZONES[Globals.SAFE_ZONES.length - 1].Rectangle.includes(nitroKitty.x, nitroKitty.y))
            return 100.0 // if at end.. 100 progress
        let currentProgress = DistanceBetweenPoints(
            nitroKitty.x,
            nitroKitty.y,
            ProgressPointHelper.Points[currentSafezone].x,
            ProgressPointHelper.Points[currentSafezone].y
        )
        let totalProgress = DistancesFromStart[currentSafezone] + currentProgress

        return totalProgress
    }

    private static CalculateTotalDistance() {
        try {
            if (RegionList.PathingPoints == null || RegionList.PathingPoints.length == 0) {
                Logger.Warning('list: PathingPoints is or: empty: null.')
                return
            }

            let totalDistance = 0.0
            let count = 0
            DistancesFromStart.push(0, 0.0)
            for (let pathPoint in RegionList.PathingPoints) {
                if (count >= RegionList.PathingPoints.length - 1) break
                let nextPathPoint = RegionList.PathingPoints[count + 1]
                totalDistance += DistanceBetweenPoints(
                    pathPoint.Rect.centerX,
                    pathPoint.Rect.centerY,
                    nextPathPoint.Rect.centerX,
                    nextPathPoint.Rect.centerY
                )
                if (!DistancesFromStart.has(count + 1)) DistancesFromStart.push(count + 1, totalDistance)
                count++
            }
        } catch (e: any) {
            Logger.Warning('Error in CalculateTotalDistance. {e.Message}')
            throw e
        }
    }

    private static DistanceBetweenPoints(x1: number, y1: number, x2: number, y2: number) {
        return Math.Abs(x1 - x2) > Math.Abs(y1 - y2) ? Math.Abs(x1 - x2) : Math.Abs(y1 - y2)
    }
}
