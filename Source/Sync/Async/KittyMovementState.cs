/// <summary>
/// Everything a receiving machine needs to carry a Kitty's stand-in effect on by itself between
/// two packets, mirroring HeroMovementState in AsyncHeroSync.ts, trimmed to what a running Kitty
/// has: where it is, where it looks, and the point it is heading to at its move speed.
/// </summary>
public struct KittyMovementState
{
    public float X;
    public float Y;
    public float Facing;
    public float TargetX;
    public float TargetY;
    public bool IsMoving;
    public float Speed;

    public KittyMovementState(float x, float y, float facing, float targetX, float targetY, bool isMoving, float speed)
    {
        X = x;
        Y = y;
        Facing = facing;
        TargetX = targetX;
        TargetY = targetY;
        IsMoving = isMoving;
        Speed = speed;
    }
}
