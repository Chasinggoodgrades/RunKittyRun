using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// Screen to world conversion, port of Screen2World.ts, itself ported from "Fast World2Screen
/// Transform" by Antares.
///
/// It reads the camera of the LOCAL player, so the result differs from one machine to another and
/// may never feed synced logic. Screen coordinates are frame coordinates (centre = 0.4, 0.3).
/// </summary>
public static class Screen2World
{
    private const float DEG_TO_RAD = 0.017453292f;
    private const int MAX_ITERATIONS = 50;

    private static location probe;

    /// <summary>Creates the location used to read terrain height. Call once, on every machine alike.</summary>
    public static void Initialize()
    {
        probe ??= Location(0, 0);
    }

    /// <summary>Terrain height at a point.</summary>
    public static float GetZ(float x, float y)
    {
        probe ??= Location(0, 0);
        MoveLocation(probe, x, y);
        return GetLocationZ(probe);
    }

    /// <summary>
    /// World point drawn at a screen position. False when the ray does not converge, which happens
    /// when it crosses the terrain at several points (a cliff between the camera and the cursor).
    /// </summary>
    public static bool TryConvert(float screenX, float screenY, out float worldX, out float worldY)
    {
        worldX = 0;
        worldY = 0;

        float eyeX = GetCameraEyePositionX();
        float eyeY = GetCameraEyePositionY();
        float eyeZ = GetCameraEyePositionZ();

        float angleOfAttack = GetCameraField(CAMERA_FIELD_ANGLE_OF_ATTACK);
        float rotation = GetCameraField(CAMERA_FIELD_ROTATION);
        float fov = GetCameraField(CAMERA_FIELD_FIELD_OF_VIEW);

        float cosAttack = Cos(angleOfAttack);
        float sinAttack = Sin(angleOfAttack);
        float cosRot = Cos(rotation);
        float sinRot = Sin(rotation);

        float yCenterScreenShift = 0.1284f * cosAttack;
        float scaleFactor = 0.0524f * fov * fov * fov - 0.0283f * fov * fov + 1.061f * fov;

        float a = (screenX - 0.4f) * scaleFactor;
        float b = (0.42625f - yCenterScreenShift - screenY) * scaleFactor;

        // unit vector towards the cursor, in the coordinate system of the camera
        float nx = 1f / SquareRoot(1f + a * a + b * b);
        float nyRadicand = 1f - (1f + b * b) * nx * nx;
        float ny = SquareRoot(nyRadicand > 0 ? nyRadicand : 0);
        float nzRadicand = 1f - nx * nx - ny * ny;
        float nz = SquareRoot(nzRadicand > 0 ? nzRadicand : 0);

        if (a > 0) ny = -ny;
        if (b < 0) nz = -nz;

        // same vector, in world coordinates
        float nxPrime = cosAttack * cosRot * nx - sinRot * ny + sinAttack * cosRot * nz;
        float nyPrime = cosAttack * sinRot * nx + cosRot * ny + sinAttack * sinRot * nz;
        float nzPrime = -sinAttack * nx + cosAttack * nz;

        // a ray that never goes down never meets the ground
        if (nzPrime > -0.0001f && nzPrime < 0.0001f) return false;

        // where that ray meets the terrain, by successive approximations
        float zGuess = GetZ(eyeX, eyeY);
        float xGuess = eyeX + nxPrime * (eyeZ - zGuess) / nzPrime;
        float yGuess = eyeY + nyPrime * (eyeZ - zGuess) / nzPrime;
        float zWorld = GetZ(xGuess, yGuess);
        float deltaZ = zWorld - zGuess;

        zGuess = zWorld;

        int i = 0;

        while ((deltaZ > 1f || deltaZ < -1f) && i < MAX_ITERATIONS)
        {
            float zWorldOld = zWorld;
            float deltaZOld = deltaZ;

            xGuess = eyeX + nxPrime * (eyeZ - zGuess) / nzPrime;
            yGuess = eyeY + nyPrime * (eyeZ - zGuess) / nzPrime;

            zWorld = GetZ(xGuess, yGuess);
            deltaZ = zWorld - zGuess;

            float denominator = deltaZOld - deltaZ;
            if (denominator > -0.00001f && denominator < 0.00001f) return false;

            zGuess = (deltaZOld * zWorld - deltaZ * zWorldOld) / denominator;

            i++;
        }

        if (i >= MAX_ITERATIONS) return false;

        // NaN guard: a NaN is never equal to itself
        if (xGuess != xGuess || yGuess != yGuess) return false;

        worldX = xGuess;
        worldY = yGuess;
        return true;
    }
}
