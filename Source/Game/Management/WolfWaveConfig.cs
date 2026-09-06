using System;

/// <summary>
/// Per-round, per-lane wolf spawn counts.
/// Uses lane-indexed arrays (0-16) for performance and clarity.
/// </summary>
public static class WolfWaveConfig
{
    private const int LaneCount = 17;

    /// <summary>
    /// Wolves per lane for the 5 standard rounds (index 0 = Round 1 … index 4 = Round 5).
    /// </summary>
    public static readonly int[][] StandardWaves =
    {
        new[] { 25, 25, 25, 25, 17, 16, 16, 15, 12, 12, 12, 7,  7,  6,  6,  2, 2 }, // Round 1
        new[] { 34, 34, 34, 34, 23, 22, 20, 19, 15, 15, 14, 10, 10, 8,  7,  3, 3 }, // Round 2
        new[] { 39, 39, 38, 38, 27, 26, 24, 22, 17, 17, 16, 12, 12, 8,  8,  3, 3 }, // Round 3
        new[] { 48, 48, 48, 46, 32, 31, 27, 26, 20, 20, 18, 14, 14, 10, 9,  4, 4 }, // Round 4
        new[] { 57, 57, 57, 57, 37, 35, 30, 29, 21, 21, 20, 16, 16, 11, 10, 5, 5 }, // Round 5
    };

    private const int ProgressiveRoundCount = 3;

    public static readonly int[][] ProgressiveWaves = BuildProgressiveWaves();

    private static int[][] BuildProgressiveWaves()
    {
        var waves = new int[ProgressiveRoundCount][];

        // Prog R1: Early lanes closer to Std R1/R2, later lanes closer to Std R3
        waves[0] = BuildLaneRampedWave(
            easy: StandardWaves[0],      // Std R1
            mid: StandardWaves[1],      // Std R2
            hard: StandardWaves[2],      // Std R3
            laneBiasStrength: 0.70f);

        // Prog R2: Between Std R3 -> R4, with lane ramp
        waves[1] = BuildLaneRampedWave(
            easy: StandardWaves[2],      // Std R3
            mid: StandardWaves[3],      // Std R4
            hard: StandardWaves[3],      // still weighted toward R4
            laneBiasStrength: 0.65f);

        // Prog R3: Between Std R4 -> R5, with lane ramp
        waves[2] = BuildLaneRampedWave(
            easy: StandardWaves[3],      // Std R4
            mid: StandardWaves[4],      // Std R5
            hard: StandardWaves[4],
            laneBiasStrength: 0.55f);

        return waves;
    }

    /// <summary>
    /// Creates a wave where lower lanes lean toward the "easy" table
    /// and higher lanes lean toward the "hard" table.
    /// </summary>
    /// <param name="easy">Lower-difficulty source (used more on early lanes)</param>
    /// <param name="mid">Middle source</param>
    /// <param name="hard">Higher-difficulty source (used more on later lanes)</param>
    /// <param name="laneBiasStrength">
    /// How strongly lane index pushes toward the hard table (0 = no bias, 1 = full bias).
    /// </param>
    private static int[] BuildLaneRampedWave(int[] easy, int[] mid, int[] hard, float laneBiasStrength)
    {
        var result = new int[LaneCount];
        float maxLane = LaneCount - 1;

        for (int lane = 0; lane < LaneCount; lane++)
        {
            // 0.0 on first lane -> 1.0 on last lane
            float laneT = lane / maxLane;

            // How much we bias toward the harder tables as lane index increases
            float hardBias = laneT * laneBiasStrength;

            // Blend: start from easy -> mid, then push toward hard based on lane
            float baseValue = Lerp(easy[lane], mid[lane], 0.55f); // slight preference for mid
            float finalValue = Lerp(baseValue, hard[lane], hardBias);

            result[lane] = (int)MathF.Round(finalValue);
        }

        return result;
    }

    private static float Lerp(float a, float b, float t) => a + (b - a) * t;

    /// <summary>
    /// Returns the lane-indexed wolf counts for the given 1-based round.
    /// Uses ProgressiveWaves when Progressive mode is active, otherwise StandardWaves.
    /// Returns null if the round is out of range.
    /// </summary>
    public static int[] GetWaveForRound(int round)
    {
        var table = DifficultyConfig.IsProgressive ? ProgressiveWaves : StandardWaves;
        int index = round - 1;

        return index >= 0 && index < table.Length ? table[index] : null;
    }
}
