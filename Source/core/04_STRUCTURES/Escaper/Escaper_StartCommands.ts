import { arrayPush, IsEscaperInGame, jsonDecode, jsonEncode } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { ServiceManager } from 'Services'
import { initSaveLoad } from '../../../Utils/SaveLoad/SaveLoad'
import { Escaper } from './Escaper'

export const SaveLoad = initSaveLoad()

export class EscaperStartCommands {
    private startCommands: string[] = []
    private escaper: Escaper
    private executed = false
    private loaded = false

    constructor(escaper: Escaper) {
        this.escaper = escaper
    }

    loadStartCommands = () => {
        if (this.executed) {
            return
        }

        this.executed = true

        if (!IsEscaperInGame(this.escaper.getEscaperId())) {
            return
        }

        SaveLoad.readFile(Constants.MEC_MSC_DATA_FILE, this.escaper.getPlayer(), data => {
            if (data.length === 0) {
                this.loaded = true
                return
            }

            const decodedData = jsonDecode<string[]>(data)

            if (typeof decodedData === 'object') {
                this.startCommands = decodedData

                for (const cmd of decodedData) {
                    ServiceManager.getService('Cmd').ExecuteCommand(this.escaper, '-' + cmd)
                }
            }

            this.loaded = true
        })
    }

    getStartCommands = () => this.startCommands

    addStartCommand = (startCommand: string) => {
        if (startCommand.startsWith('-')) {
            startCommand = startCommand.substring(1)
        }

        arrayPush(this.startCommands, startCommand)
        this.saveStartCommands()
    }

    executeStartCommand = (index: number) => {
        if (index < 0 || index >= this.startCommands.length) {
            return false
        }

        ServiceManager.getService('Cmd').ExecuteCommand(this.escaper, '-' + this.startCommands[index])
        return true
    }

    removeStartCommand = (index: number) => {
        if (index < 0 || index >= this.startCommands.length) {
            return null
        }

        const removedElement = this.startCommands.splice(index, 1)
        this.saveStartCommands()
        return removedElement
    }

    setStartCommand = (index: number, startCommand: string) => {
        if (index < 0 || index >= this.startCommands.length) {
            return false
        }

        if (startCommand.startsWith('-')) {
            startCommand = startCommand.substring(1)
        }

        this.startCommands[index] = startCommand
        this.saveStartCommands()
        return true
    }

    removeStartCommands = () => {
        this.startCommands.length = 0
        this.saveStartCommands()
    }

    saveStartCommands = () => {
        SaveLoad.saveFile(Constants.MEC_MSC_DATA_FILE, this.escaper.getPlayer(), jsonEncode(this.startCommands))
    }

    isLoaded = () => this.loaded
}
