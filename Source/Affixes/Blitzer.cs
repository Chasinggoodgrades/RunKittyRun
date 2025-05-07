using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Blitzer : Affix
{
    private static readonly int GHOST_VISIBLE = FourCC("Aeth");
    private static readonly Predicate<Affix> IsBlitzer = x => x is Blitzer;
    private const int AFFIX_ABILITY = Constants.ABILITY_BLITZER;
    private const string BLITZER_EFFECT = "war3mapImported\\ChargerCasterArt.mdx";
    private const float BLITZER_SPEED = 650.0f;
    private const float BLITZER_OVERHEAD_DELAY = 1.50f;
    private const float BLITZER_LOWEND = 6.0f;
    private const float BLITZER_HIGHEND = 11.0f;
    private AchesTimers MoveTimer;
    private AchesTimers BlitzerTimer;
    private AchesTimers PreBlitzerTimer;
    private effect Effect;
    private effect WanderEffect;

    public Blitzer(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_YELLOW}Blitzer|r";
    }

    public override void Apply()
    {
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        Unit.WanderTimer.Pause();
        Unit.OVERHEAD_EFFECT_PATH = "";
        Unit.Unit.SetVertexColor(224, 224, 120);
        RegisterMoveTimer();
        base.Apply();
    }

    public override void Remove()
    {
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        Unit.WanderTimer.Resume();
        Unit.OVERHEAD_EFFECT_PATH = Wolf.DEFAULT_OVERHEAD_EFFECT;

        GC.RemoveEffect(ref WanderEffect);
        BlitzerTimer.Dispose();
        MoveTimer.Dispose();
        PreBlitzerTimer.Dispose();
        GC.RemoveEffect(ref Effect);
        EndBlitz();
        Unit.Unit.SetVertexColor(150, 120, 255, 255);
        Unit.Unit.SetColor(playercolor.Brown);
        base.Remove();
    }

    private void RegisterMoveTimer()
    {
        MoveTimer = ObjectPool.GetEmptyObject<AchesTimers>();
        PreBlitzerTimer = ObjectPool.GetEmptyObject<AchesTimers>();
        var randomFlyTime = GetRandomReal(4.0f, 10.0f); // random time to move before blitzing
        MoveTimer.Timer.Start(randomFlyTime, false, PreBlitzerMove); // initial move
        BlitzerTimer = ObjectPool.GetEmptyObject<AchesTimers>();
    }

    private void PreBlitzerMove()
    {
        try
        {
            if (Unit.IsPaused)
            {
                MoveTimer.Timer.Start(GetRandomReal(3.0f, 10.0f), false, PreBlitzerMove);
                return;
            }
            WanderEffect ??= effect.Create(Wolf.DEFAULT_OVERHEAD_EFFECT, Unit.Unit, "overhead");
            WanderEffect.PlayAnimation(ANIM_TYPE_STAND);
            Unit.Unit.SetVertexColor(255, 255, 0);
            Unit.Unit.SetColor(playercolor.Yellow);
            PreBlitzerTimer.Timer.Start(BLITZER_OVERHEAD_DELAY, false, BeginBlitz);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in PreBlitzerMove: {e.Message}");
            throw;
        }
    }

    private void BeginBlitz()
    {
        try
        {
            var randomTime = GetRandomReal(BLITZER_LOWEND, BLITZER_HIGHEND); // blitz randomly between this time interval
            var x = GetRandomReal(Unit.Lane.MinX, Unit.Lane.MaxX);
            var y = GetRandomReal(Unit.Lane.MinY, Unit.Lane.MaxY);
            WanderEffect.PlayAnimation(ANIM_TYPE_DEATH);
            BlitzerMove(x, y);
            Unit.Unit.RemoveAbility(GHOST_VISIBLE); // ghost visible
            Effect ??= effect.Create(BLITZER_EFFECT, Unit.Unit, "origin");
            Effect.PlayAnimation(ANIM_TYPE_STAND);
            Unit.IsWalking = true;
            MoveTimer.Timer.Start(randomTime, false, PreBlitzerMove);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in BeginBlitz: {e.Message}");
            throw;
        }
    }

    private void BlitzerMove(float targetX, float targetY)
    {
        var speed = BLITZER_SPEED; // speed in yards per second
        float currentX = Unit.Unit.X;
        float currentY = Unit.Unit.Y;

        // Distance between current and target pos
        float distance = WCSharp.Shared.FastUtil.DistanceBetweenPoints(currentX, currentY, targetX, targetY);

        // stop if its within range of the target / collision thingy
        if (distance <= CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS)
        {
            EndBlitz();
            return;
        }

        // determine direction
        float directionX = (targetX - currentX) / distance;
        float directionY = (targetY - currentY) / distance;

        // 60 fps for smooth movement, step distance
        float stepDistance = speed / 50.0f; // Assuming 60 calls per second
        float nextX = currentX + (directionX * stepDistance);
        float nextY = currentY + (directionY * stepDistance);

        // Move the unit one step
        Unit.Unit.SetPosition(nextX, nextY);
        Unit.Unit.SetFacing((float)(Math.Atan2(directionY, directionX) * 180.0 / Math.PI));
        Unit.Unit.SetAnimation(2); // running animation

        var stepTime = 1.0f / 50.0f;

        // Set a timer to call this method again after a short delay
        BlitzerTimer.Timer.Start(stepTime, false, () => BlitzerMove(targetX, targetY));
    }

    private void EndBlitz()
    {
        BlitzerTimer.Pause();
        Effect.PlayAnimation(ANIM_TYPE_DEATH);
        Unit.Unit.SetAnimation(0);
        Unit.Unit.SetVertexColor(224, 224, 120);
        Unit.Unit.SetColor(playercolor.Brown);
        Unit.IsWalking = false;
        Unit.Unit.AddAbility(GHOST_VISIBLE);
    }

    public static Blitzer GetBlitzer(unit unit)
    {
        var affix = Globals.ALL_WOLVES[unit].Affixes.Find(IsBlitzer);
        return affix is Blitzer blitzer ? blitzer : null;
    }

    public void PauseBlitzing(bool pause)
    {
        if (pause)
        {
            BlitzerTimer.Pause();
            PreBlitzerTimer.Pause();
            WanderEffect.PlayAnimation(ANIM_TYPE_DEATH);
            MoveTimer.Pause();
            Unit.IsWalking = !pause;
        }
        else
        {
            BlitzerTimer.Resume();
            PreBlitzerTimer.Resume();
            MoveTimer.Resume();
            Unit.IsWalking = !pause;
        }
    }
}
