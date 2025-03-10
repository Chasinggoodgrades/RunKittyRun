using System;
using WCSharp.Api;
using WCSharp.Shared;

public static class ExecuteLua
{
    public static void LuaCode(player player, string args)
    {
        player.DisplayTextTo($"Args: {args}");
        var func = Lua.Load(
            @"return function() 
            local self = Globals.ALL_KITTIES:get(GetTriggerPlayer())
            local target = Globals.ALL_KITTIES:get(GetOwningPlayer(CustomStatFrame.SelectedUnit:get(GetTriggerPlayer())))
            "
            + args +
            @"end");
        if (func != null)
        {
            try
            {
                var result = Lua.Call(func);
                var resultFunc = (Func<object>)result;
                result = resultFunc();
                if (result != null) player.DisplayTextTo($"Result: {result.ToString()}");
            }
            catch (Exception ex)
            {
                player.DisplayTextTo($"Error: {ex.Message}");
            }
        }
        else player.DisplayTextTo("Syntax Error");
    }

}

namespace DebugUtilities
{
    public static class DebugPrinter
    {
        public static dynamic _G;

        // Converts the TypeScript function printDebugNames into C#.
        public static void PrintDebugNames(string title)
        {
            // {{ LUA_REPLACE }}
        }
    }
}