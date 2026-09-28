/// <summary>
/// Everything needed to carry a Kitty's async position/state from the machine that owns it to
/// every other machine, mirroring HeroMovementState in AsyncHeroSync.ts. Sent through the
/// Position/Death/Terrain channels so a receiving machine can place the stand-in effect exactly
/// where the owning machine had it.
/// </summary>
public struct KittyMovementState
{
    public float X;
    public float Y;
    public float Facing;
    public float FlyHeight;
    public int TerrainTypeId;

    public KittyMovementState(float x, float y, float facing, float flyHeight, int terrainTypeId = 0)
    {
        X = x;
        Y = y;
        Facing = facing;
        FlyHeight = flyHeight;
        TerrainTypeId = terrainTypeId;
    }
}
