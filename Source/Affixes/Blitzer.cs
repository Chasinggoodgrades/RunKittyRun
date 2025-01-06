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
    private effect Effect;
    private effect WanderEffect;
    public Blitzer(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_LIME}Blitzer|r";
    }

    public override void Apply()
    {
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        Unit.WanderTimer.Start(1.0f, false, () => Unit.StartWandering());
        Unit.WanderTimer.Pause();
        Unit.Unit.SetVertexColor(224, 224, 120);
        RegisterMoveTimer();
    }

    public override void Remove()
    {
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        WanderEffect?.Dispose();
        Unit.WanderTimer.Resume();
        MoveTimer.Pause();
        MoveTimer.Dispose();
        Effect.Dispose();
        EndBlitz();
        Unit.Unit.SetVertexColor(150, 120, 255, 255);
        Unit.Unit.SetColor(playercolor.Brown);
    }

    private void RegisterMoveTimer()
    {
        MoveTimer = timer.Create();
        MoveTimer.Start(5.0f, false, PreBlitzerMove); // initial move
        BlitzerTimer = timer.Create();
    }

    private void PreBlitzerMove()
    {
        WanderEffect = effect.Create(Unit.OVERHEAD_EFFECT_PATH, Unit.Unit, "overhead");
        Effect?.Dispose();
        Unit.Unit.SetVertexColor(255, 255, 0);
        Unit.Unit.SetColor(playercolor.Yellow);
        Utility.SimpleTimer(BLITZER_OVERHEAD_DELAY, BeginBlitz);
    }

    private void BeginBlitz()
    {
        var randomTime = GetRandomReal(BLITZER_LOWEND, BLITZER_HIGHEND); // blitz randomly between this time interval
        var (x, y) = Unit.WolfMove();
        WanderEffect.Dispose();
        BlitzerMove(x, y);
        Effect = effect.Create(BLITZER_EFFECT, Unit.Unit, "origin");
        MoveTimer.Start(randomTime, false, PreBlitzerMove);
    }

    private void BlitzerMove(float targetX, float targetY)
    {
        var speed = BLITZER_SPEED; // speed in yards per second
        float currentX = Unit.Unit.X;
        float currentY = Unit.Unit.Y;

        // Distance between current and target pos
        float distance = (float)Math.Sqrt(Math.Pow(targetX - currentX, 2) + Math.Pow(targetY - currentY, 2));

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
        float stepDistance = speed / 60.0f; // Assuming 60 calls per second
        float nextX = currentX + directionX * stepDistance;
        float nextY = currentY + directionY * stepDistance;

        // Move the unit one step
        Unit.Unit.SetPosition(nextX, nextY);
        Unit.Unit.SetFacing((float)(Math.Atan2(directionY, directionX) * 180.0 / Math.PI));
        Unit.Unit.SetAnimation(2);

        var stepTime = 1.0f / 60.0f; // 1/60th of a second

        // Set a timer to call this method again after a short delay
        BlitzerTimer.Start(stepTime, false, () => BlitzerMove(targetX, targetY));
    }

    private void EndBlitz()
    {
        BlitzerTimer.Pause();
        Effect.Dispose();
        Unit.Unit.SetAnimation(0);
        Unit.Unit.SetVertexColor(224, 224, 120);
        Unit.Unit.SetColor(playercolor.Brown);
        Unit.Unit.SetPathing(true);
    }








}