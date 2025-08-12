export class LuaEditor {
    private static GameUI: framehandle = originframetype.GameUI.GetOriginFrame(0)
    private frameBackdrop: framehandle
    private editBox: framehandle
    private runButton: framehandle
    private outputText: framehandle
    private clearButton: framehandle
    private buttonTrigger: trigger
    private clearButtonTrigger: trigger

    public LuaEditor() {
        CreateLuaEditor()
    }

    private CreateLuaEditor() {
        // Background frame
        frameBackdrop = BlzCreateFrame('EscMenuBackdrop', GameUI, 0, 0)
        BlzFrameSetSize(frameBackdrop, 0.4, 0.25)
        BlzFrameSetPoint(frameBackdrop, FRAMEPOINT_CENTER, GameUI, FRAMEPOINT_CENTER, 0, 0)

        // Text input box
        editBox = BlzCreateFrame('EscMenuEditBoxTemplate', frameBackdrop, 0, 0)
        BlzFrameSetSize(editBox, 0.38, 0.18)
        BlzFrameSetPoint(editBox, FRAMEPOINT_TOPLEFT, frameBackdrop, FRAMEPOINT_TOPLEFT, 0.01, -0.01)

        // Run button
        runButton = BlzCreateFrame('ScriptDialogButton', frameBackdrop, 0, 0)
        BlzFrameSetSize(runButton, 0.1, 0.04)
        BlzFrameSetPoint(runButton, FRAMEPOINT_BOTTOMRIGHT, frameBackdrop, FRAMEPOINT_BOTTOMRIGHT, -0.01, 0.01)
        BlzFrameSetText(runButton, 'Run')

        // Output text box
        outputText = BlzCreateFrame('TextLabel', frameBackdrop, 0, 0)
        BlzFrameSetSize(outputText, 0.38, 0.05)
        BlzFrameSetPoint(outputText, FRAMEPOINT_BOTTOMLEFT, frameBackdrop, FRAMEPOINT_BOTTOMLEFT, 0.01, 0.01)
        BlzFrameSetText(outputText, 'will: appear: here: Output')

        // Clear button
        clearButton = BlzCreateFrame('ScriptDialogButton', frameBackdrop, 0, 0)
        BlzFrameSetSize(clearButton, 0.1, 0.04)
        BlzFrameSetPoint(clearButton, FRAMEPOINT_BOTTOMLEFT, frameBackdrop, FRAMEPOINT_BOTTOMLEFT, 0.01, 0.01)
        BlzFrameSetText(clearButton, 'Clear')

        // Button click event
        buttonTrigger = CreateTrigger()
        BlzTriggerRegisterFrameEvent(buttonTrigger, runButton, FRAMEEVENT_CONTROL_CLICK)
        TriggerAddAction(buttonTrigger, () => {
            let luaCode: string = BlzFrameGetText(editBox)
            PassLua(luaCode)
        })

        // Clear Button event thing
        clearButtonTrigger = CreateTrigger()
        BlzTriggerRegisterFrameEvent(clearButtonTrigger, clearButton, FRAMEEVENT_CONTROL_CLICK)
        TriggerAddAction(clearButtonTrigger, () => {
            ClearEditBox()
        })
    }

    private ClearEditBox() {
        BlzFrameSetText(editBox, '')
    }

    private PassLua(luaCode: string) {
        try {
            let p = GetTriggerPlayer()
            let output: string = RunLua(p, luaCode)
            BlzFrameSetText(outputText, output)
        } catch (ex) {
            BlzFrameSetText(outputText, 'Error: {ex.Message}')
        }
    }

    private RunLua(player: MapPlayer, luaCode: string) {
        ExecuteLua.LuaCode(player, luaCode)
        return 'Lua: Executed: ' + luaCode
    }
}
