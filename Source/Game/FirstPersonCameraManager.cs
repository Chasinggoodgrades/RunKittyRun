using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class FirstPersonCamera
{
    private const float timerPeriod = 0.001f;
    private const float FIRSTPERSON_ANGLE_PER_PERIOD = 0.3f;

    private timer forceCamTimer;
    private unit hero;
    private player player;
    private Dictionary<string, bool> keyDownState;
    private string lastUnitAnimation;

    public FirstPersonCamera(unit hero, player player)
    {
        this.hero = hero;
        this.player = player;
        this.keyDownState = new Dictionary<string, bool>
        {
            { "UP", false },
            { "DOWN", false },
            { "LEFT", false },
            { "RIGHT", false }
        };
    }

    public bool IsFirstPerson() => forceCamTimer != null;

    public void ToggleFirstPerson(bool active)
    {
        if (active)
        {
            if (forceCamTimer == null)
            {
                forceCamTimer = CreateTimer();
                TimerStart(forceCamTimer, timerPeriod, true, UpdateCamera);
            }
        }
        else
        {
            if (forceCamTimer != null)
            {
                DestroyTimer(forceCamTimer);
                forceCamTimer = null;
                ResetCamera();
            }
        }
    }

    private void UpdateCamera()
    {
        if (hero == null || !hero.Alive) return;

        float fwd = 0;

        if (!(keyDownState["LEFT"] && keyDownState["RIGHT"]) && (keyDownState["LEFT"] || keyDownState["RIGHT"]))
        {
            float angle = GetUnitFacing(hero);
            if (keyDownState["LEFT"]) angle += FIRSTPERSON_ANGLE_PER_PERIOD;
            if (keyDownState["RIGHT"]) angle -= FIRSTPERSON_ANGLE_PER_PERIOD;
            BlzSetUnitFacingEx(hero, angle);
        }

        if (!(keyDownState["UP"] && keyDownState["DOWN"]) && (keyDownState["UP"] || keyDownState["DOWN"]))
        {
            float moveSpeed = GetUnitMoveSpeed(hero);
            float movePerTick = moveSpeed * timerPeriod;

            Kitty kitty = Globals.ALL_KITTIES[player];

            if (kitty.Slider.IsEnabled())
            {
                movePerTick = 0.2f;
            }

            float angle = Rad2Deg(GetUnitFacing(hero));
            if (keyDownState["UP"]) fwd += movePerTick;
            if (keyDownState["DOWN"]) fwd -= movePerTick;

            float oldX = GetUnitX(hero);
            float oldY = GetUnitY(hero);

            float newX = oldX + (fwd * Cos(angle));
            float newY = oldY + (fwd * Sin(angle));

            if (!Globals.GAME_ACTIVE && Regions.BarrierRegion.Contains(newX, newY))
            {
                return;
            }

            if (IsTerrainPathable(newX, oldY, PATHING_TYPE_WALKABILITY))
            {
                newX = oldX;
            }

            if (IsTerrainPathable(oldX, newY, PATHING_TYPE_WALKABILITY))
            {
                newY = oldY;
            }

            SetUnitX(hero, newX);
            SetUnitY(hero, newY);
        }

        if (fwd == 0)
        {
            if (this.lastUnitAnimation != "stand")
            {
                this.lastUnitAnimation = "stand";
                hero.SetAnimation(0); // 0 is stand for most units
            }
        }
        else
        {
            if (this.lastUnitAnimation != "walk")
            {
                this.lastUnitAnimation = "walk";
                hero.SetAnimation(6); // POTM is 6 for walk
            }
        }

        Blizzard.SetCameraTargetControllerNoZForPlayer(player, hero, 0, 0, true);
        Blizzard.SetCameraFieldForPlayer(player, CAMERA_FIELD_ANGLE_OF_ATTACK, 310, 0);
        Blizzard.SetCameraFieldForPlayer(player, CAMERA_FIELD_FIELD_OF_VIEW, 1500, 0);
        Blizzard.SetCameraFieldForPlayer(player, CAMERA_FIELD_ROTATION, GetUnitFacing(hero), 0);
        Blizzard.SetCameraFieldForPlayer(player, CAMERA_FIELD_ZOFFSET, 100, 0);
    }

    public void SetKeyDownState(string key, bool state)
    {
        if (keyDownState.ContainsKey(key))
        {
            keyDownState[key] = state;
        }
    }

    private void ResetCamera()
    {
        if (!player.IsLocal) return;
        ResetToGameCamera(0);
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, 2400.0f, 0.0f);
    }
}

public static class FirstPersonCameraManager
{
    private static Dictionary<player, FirstPersonCamera> cameras = new Dictionary<player, FirstPersonCamera>();

    public static void Initialize()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var hero = GetHeroForPlayer(player);
            if (hero != null)
            {
                cameras[player] = new FirstPersonCamera(hero, player);
            }
        }

        RegisterKeyEvents();
    }

    private static void RegisterKeyEvents()
    {
        var keyStates = new Dictionary<bool, int>
    {
        { true, Blizzard.bj_KEYEVENTTYPE_DEPRESS },
        { false, Blizzard.bj_KEYEVENTTYPE_RELEASE }
    };

        var keys = new Dictionary<string, int>
    {
        { "UP", Blizzard.bj_KEYEVENTKEY_UP },
        { "DOWN", Blizzard.bj_KEYEVENTKEY_DOWN },
        { "LEFT", Blizzard.bj_KEYEVENTKEY_LEFT },
        { "RIGHT", Blizzard.bj_KEYEVENTKEY_RIGHT }
    };

        foreach (var keyState in keyStates)
        {
            foreach (var key in keys)
            {
                foreach (var p in Globals.ALL_PLAYERS)
                {
                    var keyTrigger = CreateTrigger();
                    var localKey = key.Key; // Create a local copy of the key
                    var localValue = keyState.Key; // Create a local copy of the value
                    Blizzard.TriggerRegisterPlayerKeyEventBJ(keyTrigger, p, keyState.Value, key.Value);
                    TriggerAddAction(keyTrigger, () => OnKeyEvent(localKey, localValue));
                }
            }
        }
    }

    private static void OnKeyEvent(string key, bool isDown)
    {
        var player = GetTriggerPlayer();
        if (cameras.ContainsKey(player))
        {
            cameras[player].SetKeyDownState(key, isDown);
        }
    }

    private static unit GetHeroForPlayer(player player)
    {
        return Globals.ALL_KITTIES.ContainsKey(player) ? Globals.ALL_KITTIES[player].Unit : null;
    }

    public static void ToggleFirstPerson(player player)
    {
        if (cameras.ContainsKey(player))
        {
            cameras[player].ToggleFirstPerson(!cameras[player].IsFirstPerson());
        }
    }

    public static void SetFirstPerson(player player, bool active)
    {
        if (cameras.ContainsKey(player))
        {
            cameras[player].ToggleFirstPerson(active);
        }
    }
}
