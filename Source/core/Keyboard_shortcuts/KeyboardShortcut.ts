import { createEvent } from '../../Utils/mapUtils'
import { ServiceManager } from '../../Services'
import { Escaper } from '../04_STRUCTURES/Escaper/Escaper'

export const GetStringAssignedFromCommand = (command: string) => {
    let outputStr: string
    let spaceFound = false
    let cmdLength = StringLength(command)
    let charId = 3
    while (true) {
        if (charId >= cmdLength) break
        if (SubStringBJ(command, charId, charId) === ' ') {
            if (!spaceFound) {
                spaceFound = true
            } else {
                outputStr = SubStringBJ(command, charId + 1, cmdLength) ?? ''
                if (
                    SubStringBJ(outputStr, 1, 1) === '(' &&
                    SubStringBJ(outputStr, StringLength(outputStr), StringLength(outputStr)) === ')'
                ) {
                    outputStr = SubStringBJ(outputStr, 2, StringLength(outputStr) - 1) ?? ''
                }
                return outputStr
            }
        }
        charId = charId + 1
    }
    return null
}

const string2AcceptedOsKey: { [x: string]: oskeytype } = {
    '0': OSKEY_0,
    '1': OSKEY_1,
    '2': OSKEY_2,
    '3': OSKEY_3,
    '4': OSKEY_4,
    '5': OSKEY_5,
    '6': OSKEY_6,
    '7': OSKEY_7,
    '8': OSKEY_8,
    '9': OSKEY_9,
    a: OSKEY_A,
    b: OSKEY_B,
    c: OSKEY_C,
    d: OSKEY_D,
    e: OSKEY_E,
    f: OSKEY_F,
    g: OSKEY_G,
    h: OSKEY_H,
    i: OSKEY_I,
    j: OSKEY_J,
    k: OSKEY_K,
    l: OSKEY_L,
    m: OSKEY_M,
    n: OSKEY_N,
    o: OSKEY_O,
    p: OSKEY_P,
    q: OSKEY_Q,
    r: OSKEY_R,
    s: OSKEY_S,
    t: OSKEY_T,
    u: OSKEY_U,
    v: OSKEY_V,
    w: OSKEY_W,
    x: OSKEY_X,
    y: OSKEY_Y,
    z: OSKEY_Z,
    n0: OSKEY_NUMPAD0,
    n1: OSKEY_NUMPAD1,
    n2: OSKEY_NUMPAD2,
    n3: OSKEY_NUMPAD3,
    n4: OSKEY_NUMPAD4,
    n5: OSKEY_NUMPAD5,
    n6: OSKEY_NUMPAD6,
    n7: OSKEY_NUMPAD7,
    n8: OSKEY_NUMPAD8,
    n9: OSKEY_NUMPAD9,
}

const string2AllowedKeyModifier: { [x: string]: number } = {
    c: 2, //ctrl
    s: 1, //shift
}

const keyModifier2String: { [x: number]: string } = {
    0: '',
    1: 'S',
    2: 'C',
    3: 'CS',
}

const shortcutKeyDefinitionErrorMsg = 'wrong shortcut key'

export class KeyboardShortcut {
    private escaper: Escaper
    private shortcutString: string
    private command: string

    private shortcutKey: oskeytype
    private shortcutKeyStr: string
    private shortcutKeyModifier: number

    private event: trigger | null = null

    constructor(escaper: Escaper, shortcutString: string, command: string) {
        //find the key and modifier according to shortcut string
        shortcutString = shortcutString.toLowerCase()
        const len = shortcutString.length

        let charKey: string = ''
        let modifier: number = 0

        //first find the charKey
        if (len >= 1) {
            let lastModifierCharPos = len - 2
            charKey = shortcutString[len - 1]
            if (len >= 2) {
                const prevChar = shortcutString[len - 2]
                if (prevChar == 'n') {
                    charKey = prevChar + charKey
                    lastModifierCharPos = len - 3
                }
            }

            if (lastModifierCharPos >= 0) {
                const modifiersStr = shortcutString.substring(0, lastModifierCharPos + 1).split('')
                for (let modifierStr of modifiersStr) {
                    if (!string2AllowedKeyModifier[modifierStr]) {
                        throw shortcutKeyDefinitionErrorMsg
                    }

                    modifier += string2AllowedKeyModifier[modifierStr]
                }
            }
        }

        if (!string2AcceptedOsKey[charKey] || !keyModifier2String[modifier]) {
            throw shortcutKeyDefinitionErrorMsg
        }

        if (command.length == 0) {
            throw 'you need a command for your shortcut'
        }

        this.escaper = escaper
        this.shortcutString = shortcutString
        this.shortcutKeyStr = charKey
        this.command = (command.substring(0, 1) == '-' ? '' : '-') + command
        this.shortcutKey = string2AcceptedOsKey[charKey]
        this.shortcutKeyModifier = modifier
    }

    enableEvent = () => {
        this.event && DestroyTrigger(this.event)

        this.event = createEvent({
            events: [
                t => {
                    BlzTriggerRegisterPlayerKeyEvent(
                        t,
                        this.escaper.getPlayer(),
                        this.shortcutKey,
                        this.shortcutKeyModifier,
                        false
                    )
                },
            ],
            actions: [
                () => {
                    const { ExecuteCommand } = ServiceManager.getService('Cmd')
                    ExecuteCommand(this.escaper, this.command)
                },
            ],
        })
    }

    disableEvent = () => {
        this.event && DestroyTrigger(this.event)
    }

    destroy = () => {
        this.disableEvent()
    }

    toDisplayString = () => {
        return keyModifier2String[this.shortcutKeyModifier] + this.shortcutKeyStr + ' : ' + this.command
    }

    getShortcutString = () => {
        return this.shortcutString
    }

    toJson = () => ({
        //useless but mandatory due to BaseArray implementation
    })
}
