using WCSharp.Api;
using static WCSharp.Api.Common;
using System;

public class LuaEditor
{
    private static framehandle GameUI = originframetype.GameUI.GetOriginFrame(0);
    private framehandle frameBackdrop;
    private framehandle editBox;
    private framehandle runButton;
    private framehandle outputText;
    private framehandle clearButton;
    private trigger buttonTrigger;
    private trigger clearButtonTrigger;

    public LuaEditor()
    {
        CreateLuaEditor();
    }

    private void CreateLuaEditor()
    {

        // Background frame
        frameBackdrop = BlzCreateFrame("EscMenuBackdrop", GameUI, 0, 0);
        BlzFrameSetSize(frameBackdrop, 0.4f, 0.25f);
        BlzFrameSetPoint(frameBackdrop, FRAMEPOINT_CENTER, GameUI, FRAMEPOINT_CENTER, 0, 0);

        // Text input box
        editBox = BlzCreateFrame("EscMenuEditBoxTemplate", frameBackdrop, 0, 0);
        BlzFrameSetSize(editBox, 0.38f, 0.18f);
        BlzFrameSetPoint(editBox, FRAMEPOINT_TOPLEFT, frameBackdrop, FRAMEPOINT_TOPLEFT, 0.01f, -0.01f);

        // Run button
        runButton = BlzCreateFrame("ScriptDialogButton", frameBackdrop, 0, 0);
        BlzFrameSetSize(runButton, 0.1f, 0.04f);
        BlzFrameSetPoint(runButton, FRAMEPOINT_BOTTOMRIGHT, frameBackdrop, FRAMEPOINT_BOTTOMRIGHT, -0.01f, 0.01f);
        BlzFrameSetText(runButton, "Run");

        // Output text box
        outputText = BlzCreateFrame("TextLabel", frameBackdrop, 0, 0);
        BlzFrameSetSize(outputText, 0.38f, 0.05f);
        BlzFrameSetPoint(outputText, FRAMEPOINT_BOTTOMLEFT, frameBackdrop, FRAMEPOINT_BOTTOMLEFT, 0.01f, 0.01f);
        BlzFrameSetText(outputText, "Output will appear here");

        // Clear button
        clearButton = BlzCreateFrame("ScriptDialogButton", frameBackdrop, 0, 0);
        BlzFrameSetSize(clearButton, 0.1f, 0.04f);
        BlzFrameSetPoint(clearButton, FRAMEPOINT_BOTTOMLEFT, frameBackdrop, FRAMEPOINT_BOTTOMLEFT, 0.01f, 0.01f);
        BlzFrameSetText(clearButton, "Clear");

        // Button click event
        buttonTrigger = CreateTrigger();
        BlzTriggerRegisterFrameEvent(buttonTrigger, runButton, FRAMEEVENT_CONTROL_CLICK);
        TriggerAddAction(buttonTrigger, () =>
        {
            string luaCode = BlzFrameGetText(editBox);
            PassLua(luaCode);
        });

        // Clear Button event thing
        clearButtonTrigger = CreateTrigger();
        BlzTriggerRegisterFrameEvent(clearButtonTrigger, clearButton, FRAMEEVENT_CONTROL_CLICK);
        TriggerAddAction(clearButtonTrigger, () =>
        {
            ClearEditBox();
        });

    }

    private void ClearEditBox()
    {
        BlzFrameSetText(editBox, "");
    }

    private void PassLua(string luaCode)
    {
        try
        {
            var p = @event.Player;
            string output = RunLua(p, luaCode);
            BlzFrameSetText(outputText, output);
        }
        catch (Exception ex)
        {
            BlzFrameSetText(outputText, $"Error: {ex.Message}");
        }
    }

    private string RunLua(player player, string luaCode)
    {
        ExecuteLua.LuaCode(player, luaCode);
        return "Executed Lua: " + luaCode;
    }
}
