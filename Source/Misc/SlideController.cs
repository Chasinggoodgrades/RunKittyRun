using System;

/// <summary>
/// The turn controller of the slide, taken out of Slider so the unit (Slider) and the async stand-in
/// effect (KittyAsyncEffect) turn with the very same numbers: a click sets how many degrees are left to
/// turn, and each period turns by an amount that follows a speed table, so a slide steers the same
/// wherever it is simulated. Pure arithmetic: it touches no unit.
/// </summary>
public sealed class SlideController
{
    /// <summary>Seconds in one slide period: the Slider moves and turns this often.</summary>
    public const float INTERVAL = 0.0075f;

    private const float ROTATION_SPEED = 1.3f;
    private const float ROTATION_TIME_FOR_MAXIMUM_SPEED = 0.11f;
    private const int MAX_DEGREE_ON_WHICH_SPEED_TABLE_TAKES_CONTROL = 51;

    /// <summary>Percentage of the maximum turn per period, by the degrees left to turn (0 to 51).</summary>
    private static readonly float[] SpeedAtLessThan50Degrees = { 1.5f, 1.837f, 2.800f, 6.366f, 9.091f, 13.943f, 23.975f, 27.837f, 31.698f, 35.560f, 37.960f, 40.355f, 42.750f, 44.260f, 45.767f, 47.275f, 48.783f, 50.291f, 51.866f, 53.440f, 55.015f, 56.590f, 58.165f, 58.165f, 59.804f, 61.442f, 63.081f, 64.719f, 66.357f, 66.360f, 67.776f, 69.192f, 70.607f, 72.023f, 73.439f, 74.854f, 74.919f, 76.374f, 77.828f, 79.283f, 80.737f, 82.192f, 83.646f, 84.189f, 85.255f, 86.322f, 87.389f, 88.455f, 89.522f, 90.588f, 91.655f, 92.721f };

    private float remainingDegrees;
    private float currentTurnPerPeriod;

    /// <summary>Degrees still to turn (signed). Zero when the facing is where the last click wanted it.</summary>
    public float Remaining => remainingDegrees;

    public void Reset()
    {
        remainingDegrees = 0f;
        currentTurnPerPeriod = 0f;
    }

    public void SetRemaining(float degrees)
    {
        if (Math.Abs(degrees) < 0.01f) degrees = 0f;
        remainingDegrees = degrees;
    }

    public static float NormalizeAngle(float angle)
    {
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    }

    /// <summary>Whole degrees, between -180 and 180, to turn from one facing to another.</summary>
    public static int AnglesDiff(float endAngle, float startAngle)
    {
        endAngle = NormalizeAngle(endAngle);
        startAngle = NormalizeAngle(startAngle);

        var anglesDiff = endAngle - startAngle;
        if (anglesDiff < -180) anglesDiff += 360;
        if (anglesDiff > 180) anglesDiff -= 360;

        return (int)anglesDiff;
    }

    /// <summary>
    /// One period of turning. Returns false when there is nothing to turn; otherwise
    /// <paramref name="newAngle"/> is the facing after this period.
    /// </summary>
    public bool TurnOnePeriod(float currentAngle, out float newAngle)
    {
        newAngle = currentAngle;

        float maxSlideTurnPerPeriod = ROTATION_SPEED * INTERVAL * 360;
        float remaining = remainingDegrees;

        if (remaining == 0) return false;

        float diffToApplyAbs = Math.Min(Math.Abs(remaining), Math.Abs(maxSlideTurnPerPeriod));

        if (diffToApplyAbs <= 0.05f) return false;

        int sens = remaining * maxSlideTurnPerPeriod > 0 ? 1 : -1;
        float maxIncreaseRotationSpeedPerPeriod = Math.Abs(maxSlideTurnPerPeriod * INTERVAL / ROTATION_TIME_FOR_MAXIMUM_SPEED);

        float curSlideTurn = currentTurnPerPeriod;
        float diffToApply;

        if (Math.Abs(remaining) <= MAX_DEGREE_ON_WHICH_SPEED_TABLE_TAKES_CONTROL)
        {
            int tableInd = (int)Math.Round((float)Math.Abs(remaining));
            float aimedSpeedPercentage = SpeedAtLessThan50Degrees[tableInd];
            float aimedNewSpeedPerPeriod = maxSlideTurnPerPeriod * aimedSpeedPercentage * sens / 100;
            float diffSpeed = aimedNewSpeedPerPeriod - curSlideTurn;

            if (Math.Abs(diffSpeed) < maxIncreaseRotationSpeedPerPeriod)
            {
                diffToApply = aimedNewSpeedPerPeriod;
            }
            else
            {
                int sensDiffToApply = diffSpeed > 0 ? 1 : -1;
                diffToApply = curSlideTurn + (sensDiffToApply * maxIncreaseRotationSpeedPerPeriod);
            }

            currentTurnPerPeriod = diffToApply;
        }
        else
        {
            float newSlideTurn;

            if (sens > 0)
            {
                newSlideTurn = Math.Min(curSlideTurn + maxIncreaseRotationSpeedPerPeriod, maxSlideTurnPerPeriod);
                diffToApply = Math.Min(newSlideTurn, diffToApplyAbs);
                diffToApply = Math.Min(remaining, diffToApply);
            }
            else
            {
                newSlideTurn = Math.Max(curSlideTurn - maxIncreaseRotationSpeedPerPeriod, -maxSlideTurnPerPeriod);
                diffToApply = Math.Max(newSlideTurn, -diffToApplyAbs);
                diffToApply = Math.Max(remaining, diffToApply);
            }

            currentTurnPerPeriod = newSlideTurn;
        }

        SetRemaining(remaining - diffToApply);

        newAngle = currentAngle + diffToApply;
        return true;
    }
}
