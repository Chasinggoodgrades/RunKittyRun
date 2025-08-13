import { ExecuteLua } from 'src/Events/Commands/ExecuteLua'
import { blzCreateFrame, getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Frame, MapPlayer, Trigger } from 'w3ts'

export class LuaEditor {
    private static GameUI: Frame = Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!
    private frameBackdrop: Frame
    private editBox: Frame
    private runButton: Frame
    private outputText: Frame
    private clearButton: Frame
    private buttonTrigger: Trigger
    private clearButtonTrigger: Trigger

    public LuaEditor() {
        this.CreateLuaEditor()
    }

    private CreateLuaEditor() {
        // Background frame
        this.frameBackdrop = blzCreateFrame('EscMenuBackdrop', LuaEditor.GameUI, 0, 0)
        this.frameBackdrop.setSize(0.4, 0.25)
        this.frameBackdrop.setPoint(FRAMEPOINT_CENTER, LuaEditor.GameUI, FRAMEPOINT_CENTER, 0, 0)

        // Text input box
        this.editBox = blzCreateFrame('EscMenuEditBoxTemplate', this.frameBackdrop, 0, 0)
        this.editBox.setSize(0.38, 0.18)
        this.editBox.setPoint(FRAMEPOINT_TOPLEFT, this.frameBackdrop, FRAMEPOINT_TOPLEFT, 0.01, -0.01)

        // Run button
        this.runButton = blzCreateFrame('ScriptDialogButton', this.frameBackdrop, 0, 0)
        this.runButton.setSize(0.1, 0.04)
        this.runButton.setPoint(FRAMEPOINT_BOTTOMRIGHT, this.frameBackdrop, FRAMEPOINT_BOTTOMRIGHT, -0.01, 0.01)
        this.runButton.setText('Run')

        // Output text box
        this.outputText = blzCreateFrame('TextLabel', this.frameBackdrop, 0, 0)
        this.outputText.setSize(0.38, 0.05)
        this.outputText.setPoint(FRAMEPOINT_BOTTOMLEFT, this.frameBackdrop, FRAMEPOINT_BOTTOMLEFT, 0.01, 0.01)
        this.outputText.setText('will: appear: here: Output')

        // Clear button
        this.clearButton = blzCreateFrame('ScriptDialogButton', this.frameBackdrop, 0, 0)
        this.clearButton.setSize(0.1, 0.04)
        this.clearButton.setPoint(FRAMEPOINT_BOTTOMLEFT, this.frameBackdrop, FRAMEPOINT_BOTTOMLEFT, 0.01, 0.01)
        this.clearButton.setText('Clear')

        // Button click event
        this.buttonTrigger = Trigger.create()!
        BlzTriggerRegisterFrameEvent(this.buttonTrigger, this.runButton, FRAMEEVENT_CONTROL_CLICK)
        TriggerAddAction(this.buttonTrigger, () => {
            let luaCode: string = BlzFrameGetText(this.editBox)
            this.PassLua(luaCode)
        })

        // Clear Button event thing
        this.clearButtonTrigger = Trigger.create()!
        BlzTriggerRegisterFrameEvent(this.clearButtonTrigger, this.clearButton, FRAMEEVENT_CONTROL_CLICK)
        TriggerAddAction(this.clearButtonTrigger, () => {
            this.ClearEditBox()
        })
    }

    private ClearEditBox() {
        this.editBox.setText('')
    }

    private PassLua(luaCode: string) {
        try {
            let p = getTriggerPlayer()
            let output: string = this.RunLua(p, luaCode)
            this.outputText.setText(output)
        } catch (ex: any) {
            this.outputText.setText('Error: {ex.Message}')
        }
    }

    private RunLua(player: MapPlayer, luaCode: string) {
        ExecuteLua.LuaCode(player, luaCode)
        return 'Lua: Executed: ' + luaCode
    }
}
