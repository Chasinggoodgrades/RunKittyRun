using System;
using WCSharp.Api;
using WCSharp.Shared;
using static WCSharp.Api.Common;

/// <summary>
/// Asynchronous mouse state of THIS machine, port of AsyncMouse.ts.
///
/// BlzGetMouseScreenPosX/Y, BlzPixelToFrameX/Y and BlzIsMouseButtonPressed are Warcraft III 3.0
/// natives that WCSharp.Api 3.3.9 does not expose, so they are reached through two tiny Lua
/// functions, compiled once (same Lua.Load / Lua.Call pattern as the "test34" command).
///
/// Everything here answers at once and differs from one machine to another: it may only ever
/// feed purely local, visual logic (see KittyAsyncEffect), never synced game state.
/// Positions are in frame coordinates: the centre of the screen is (0.4, 0.3).
/// </summary>
public static class AsyncMouse
{
    // Typed readers: the Lua functions hand back a boolean and plain numbers, so reading the mouse
    // builds no string and no array (it is read every tick).
    private static Func<bool> isRightPressedFn;
    private static Func<float> mouseXFn;
    private static Func<float> mouseYFn;
    private static bool initialized;

    /// <summary>False when the Lua natives could not be reached: every async feature then stays off.</summary>
    public static bool IsAvailable { get; private set; }

    /// <summary>Compiles the Lua readers. Call once at game start, on every machine alike.</summary>
    public static void Initialize()
    {
        if (initialized) return;
        initialized = true;

        try
        {
            isRightPressedFn = CompileBool(
                @"return function()
                    return BlzIsMouseButtonPressed(MOUSE_BUTTON_TYPE_RIGHT) and true or false
                end");

            mouseXFn = CompileFloat(
                @"return function()
                    return BlzPixelToFrameX(BlzGetMouseScreenPosX())
                end");

            mouseYFn = CompileFloat(
                @"return function()
                    return BlzPixelToFrameY(BlzGetMouseScreenPosY())
                end");

            IsAvailable = isRightPressedFn != null && mouseXFn != null && mouseYFn != null;
        }
        catch (Exception e)
        {
            IsAvailable = false;
            Logger.Warning($"AsyncMouse unavailable: {e.Message}");
        }
    }

    private static Func<bool> CompileBool(string luaChunk)
    {
        var chunk = Lua.Load(luaChunk);
        if (chunk == null) return null;

        return (Func<bool>)Lua.Call(chunk);
    }

    private static Func<float> CompileFloat(string luaChunk)
    {
        var chunk = Lua.Load(luaChunk);
        if (chunk == null) return null;

        return (Func<float>)Lua.Call(chunk);
    }

    /// <summary>Whether the right button of this machine is down right now.</summary>
    public static bool IsRightPressed()
    {
        if (!IsAvailable) return false;

        return isRightPressedFn();
    }

    /// <summary>Cursor of this machine in frame coordinates. False when it could not be read.</summary>
    public static bool TryGetPosition(out float x, out float y)
    {
        x = 0.4f;
        y = 0.3f;

        if (!IsAvailable) return false;

        x = mouseXFn();
        y = mouseYFn();
        return true;
    }
}
