import { ServiceManager } from 'Services'
import { Escaper } from './Escaper'

const savedCommands: { [escaperId: number]: { [commandName: string]: string } } = {}

export const newCmd = (escaper: Escaper, commandName: string, command: string) => {
    !savedCommands[escaper.getEscaperId()] && (savedCommands[escaper.getEscaperId()] = {})
    savedCommands[escaper.getEscaperId()][commandName] = command
}

export const execute = (escaper: Escaper, commandName: string, directCommand = false): boolean => {
    let cmd: string | undefined

    if (directCommand) {
        cmd = commandName
    } else {
        cmd = savedCommands[escaper.getEscaperId()]?.[commandName]
    }

    if (!cmd) {
        return false
    } else {
        ServiceManager.getService('Cmd').ExecuteCommand(escaper, cmd)
    }

    return true
}
