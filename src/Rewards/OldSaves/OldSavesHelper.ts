export class OldSavesHelper {
    public static charset = "!$%&'()*+,-.0123456789:;=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}`"
    private static PlayerCharSet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

    public static Player_CharToInt(c: string) {
        for (let i = 0; i < OldSavesHelper.PlayerCharSet.length; i++) {
            if (c === OldSavesHelper.PlayerCharSet[i]) {
                return i
            }
        }
        return -1
    }

    public static ModuloInteger = (x: number, n: number) => {
        return ((x % n) + n) % n
    }

    public static CharToInt = (c: string) => {
        let i = 0
        while (i < OldSavesHelper.charset.length && c !== OldSavesHelper.charset[i]) {
            i++
        }
        return i
    }

    public static AbilityList = [
        1097690227, // Amls
        1098018659, // Aroc
        1097689443, // Amic
        1097689452, // Amil
        1097034854, // Aclf
        1097035111, // Acmg
        1097098598, // Adef
        1097099635, // Adis
        1097228916, // Afbt
        1097228907, // Afbk
    ]
}
