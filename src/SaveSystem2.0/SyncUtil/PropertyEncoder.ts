import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { base64Decode, base64Encode } from 'w3ts'
import { SaveManager } from '../SaveManager'

export class PropertyEncoder {
    public static EncodeToJsonBase64(obj: object) {
        try {
            let jsonString = ['{']
            this.AppendProperties(obj, jsonString)
            jsonString.push('}')

            let base64String = base64Encode(jsonString.join(''))
            return base64String
        } catch (ex: any) {
            // Handle any exceptions that may occur during encoding
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in PropertyEncoder.EncodeToJsonBase64: {ex.Message}')
            throw ex
        }
    }

    private static GetJsonData(obj: object) {
        let jsonString = ['{']
        this.AppendProperties(obj, jsonString)
        jsonString.push('}')

        return jsonString.join('')
    }

    public static EncodeAllDataToJsonBase64(): string {
        try {
            let jsonString: string = ''
            jsonString += '{'
            for (let player of Globals.ALL_PLAYERS) {
                let playerData = SaveManager.SaveData.get(player)
                if (!playerData) continue
                jsonString += `"{player.name}":{GetJsonData(playerData)},`
            }
            if (jsonString.length > 0 && jsonString[jsonString.length - 1] === ',') {
                jsonString = jsonString.slice(0, -1)
            }
            jsonString += '}'

            let base64String = base64Encode(jsonString)
            return base64String
        } catch (ex: any) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in PropertyEncoder.EncodeAllDataToJsonBase64: {ex.Message}')
            throw ex
        }
    }

    private static AppendProperties(obj: object, jsonString: string[]) {
        if (obj == null) return

        let properties = Object.keys(obj)
        let firstProperty: boolean = true

        for (let i = 0; i < properties.length; i++) {
            let name = properties[i]
            let value = (obj as any)[name]

            if (!firstProperty) {
                jsonString.push(',')
            }
            firstProperty = false

            jsonString.push(`"${name}":`)

            if (value !== null && typeof value === 'object' && !Array.isArray(value) && typeof value !== 'string') {
                jsonString.push('{')
                this.AppendProperties(value, jsonString)
                jsonString.push('}')
            } else {
                typeof value === 'string' ? jsonString.push(`"${value}"`) : jsonString.push(`${value}`)
            }
        }
    }

    public static DecodeFromJsonBase64(base64EncodedData: string[]) {
        // Decode the Base64 string to a JSON-like string
        let jsonString = base64Decode(base64EncodedData.join(''))
        return jsonString
    }
}
