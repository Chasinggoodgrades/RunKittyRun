using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Blitzer : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_BLITZER;
    private const string BLITZER_EFFECT = "war3mapImported\\ChargerCasterArt.mdx";
    private const float BLITZER_SPEED = 650.0f;
    private const float BLITZER_OVERHEAD_DELAY = 1.50f;
    private const float BLITZER_LOWEND = 6.0f;
    private const float BLITZER_HIGHEND = 11.0f;
    private timer MoveTimer;
    private timer BlitzerTimer;
    private timer PreBlitzerTimer;
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
        GC.RemoveTimer(ref BlitzerTimer);
        GC.RemoveTimer(ref MoveTimer);
        GC.RemoveTimer(ref PreBlitzerTimer);
        GC.RemoveEffect(ref Effect);
        EndBlitz();
        Unit.Unit.SetVertexColor(150, 120, 255, 255);
        Unit.Unit.SetColor(playercolor.Brown);
        base.Remove();
    }

    private void RegisterMoveTimer()
    {
        MoveTimer = timer.Create();
        PreBlitzerTimer = timer.Create();
        var randomFlyTime = GetRandomReal(4.0f, 10.0f); // random time to move before blitzing
        MoveTimer.Start(randomFlyTime, false, PreBlitzerMove); // initial move
        BlitzerTimer = timer.Create();
    }

    private void PreBlitzerMove()
    {
        if (Unit.IsPaused)
        {
            MoveTimer.Start(GetRandomReal(3.0f, 10.0f), false, PreBlitzerMove);
            return;
        }
        WanderEffect = effect.Create(Wolf.DEFAULT_OVERHEAD_EFFECT, Unit.Unit, "overhead");
        Effect?.Dispose();
        Unit.Unit.SetVertexColor(255, 255, 0);
        Unit.Unit.SetColor(playercolor.Yellow);
        PreBlitzerTimer.Start(BLITZER_OVERHEAD_DELAY, false, BeginBlitz);
    }

    private void BeginBlitz()
    {
        var randomTime = GetRandomReal(BLITZER_LOWEND, BLITZER_HIGHEND); // blitz randomly between this time interval
        var x = GetRandomReal(Unit.Lane.MinX, Unit.Lane.MaxX);
        var y = GetRandomReal(Unit.Lane.MinY, Unit.Lane.MaxY);
        WanderEffect.Dispose();
        BlitzerMove(x, y);
        Unit.Unit.RemoveAbility(FourCC("Aeth")); // ghost visible
        Effect = effect.Create(BLITZER_EFFECT, Unit.Unit, "origin");
        Unit.IsWalking = true;
        MoveTimer.Start(randomTime, false, PreBlitzerMove);
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
        BlitzerTimer.Start(stepTime, false, () => BlitzerMove(targetX, targetY));
    }

    private void EndBlitz()
    {
        BlitzerTimer.Pause();
        Effect.Dispose();
        Effect = null;
        Unit.Unit.SetAnimation(0);
        Unit.Unit.SetVertexColor(224, 224, 120);
        Unit.Unit.SetColor(playercolor.Brown);
        Unit.IsWalking = false;
        Unit.Unit.AddAbility(FourCC("Aeth"));
    }

    public static Blitzer GetBlitzer(unit unit)
    {
        var affix = Globals.ALL_WOLVES[unit].Affixes.Find(a => a is Blitzer);
        return affix is Blitzer blitzer ? blitzer : null;
    }

    public void PauseBlitzing(bool pause)
    {
        if (pause)
        {
            BlitzerTimer.Pause();
            PreBlitzerTimer.Pause();
            WanderEffect.Dispose();
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
