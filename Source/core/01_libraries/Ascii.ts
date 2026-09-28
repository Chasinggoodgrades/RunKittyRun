const TABLE_ASCII = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
const DEBUT_TABLE_ASCII = 32
const TAILLE_TABLE_ASCII = StringLength(TABLE_ASCII)

//Permet de convertir un caractère en son nombre Ascii correspondant.
//@caractere string : Caractère a convertir. Ne doit contenir qu'un seul caractère !
//@return integer : Code Ascii de caractere.
//                  Ou -1, si caractere n'est pas conforme.
export const CaractereVersAscii = (caractere: string): number => {
    //Le caractère est recherché dans TABLE_ASCII, et son rang est renvoyé.

    let curseurSurTableAscii = 0

    while (
        !(
            curseurSurTableAscii >= TAILLE_TABLE_ASCII ||
            SubString(TABLE_ASCII, curseurSurTableAscii, curseurSurTableAscii + 1) == caractere
        )
    ) {
        curseurSurTableAscii = curseurSurTableAscii + 1
    }

    if (curseurSurTableAscii < TAILLE_TABLE_ASCII) {
        return curseurSurTableAscii + DEBUT_TABLE_ASCII
    }

    //Caractère non reconnu.
    return -1
}

//Permet de convertir un code Ascii en son caractère correspondant.
//@integer source : Code Ascii a convertir. Doit être entre 32 et 126.
//@return string : Caractère correspondant au code Ascii de source.
//                 Ou chaine vide, en cas d'erreur.
export const AsciiVersCaractere = (source: number): string => {
    //Le caractère de TABLE_ASCII correspondant au rang est renvoyé.
    if (source >= DEBUT_TABLE_ASCII && source <= StringLength(TABLE_ASCII) - 1 + DEBUT_TABLE_ASCII) {
        return SubString(TABLE_ASCII, source - DEBUT_TABLE_ASCII, source - (DEBUT_TABLE_ASCII - 1)) ?? ''
    }
    //Code Ascii non reconnu.
    return ''
}

export const String2Ascii = (source: string): number => {
    //La chaine est parcouru de gauche à droite et convertis en même temps.
    //En cas d'erreur, -1 est renvoyé.

    let resultat = 0
    let resultatIntermediaire = 0
    let curseurSurSource = 0
    const sourceTaille = StringLength(source)

    while (!(curseurSurSource >= sourceTaille || resultatIntermediaire == -1)) {
        resultatIntermediaire = CaractereVersAscii(SubString(source, curseurSurSource, curseurSurSource + 1) ?? '')
        resultat = resultat * 256 + resultatIntermediaire
        curseurSurSource = curseurSurSource + 1
    }

    if (resultatIntermediaire != -1) {
        return resultat
    }

    //Un caractère n'a pas été reconnue dans source.
    return -1
}

export const Ascii2String = (source: number): string => {
    //source est divisé successivement par 256 et le reste est utilisé pour retrouver le caractère correspondant.
    //Le résultat est construit en même temps.
    //En cas d'erreur, "" est retourné.

    let resultat = ''
    let resultatIntermediaire = ' ' //Pour éviter une initialisation à "".
    let modulo = 1 //Pour éviter une initialisation à 0.

    while (!(resultatIntermediaire == '' || modulo <= 0)) {
        modulo = source - Math.round(source / 256) * 256
        resultatIntermediaire = AsciiVersCaractere(modulo)
        resultat = resultatIntermediaire + resultat
        source = Math.round(source / 256)
    }

    if (modulo == 0) {
        return resultat
    }

    //Le code n'a pas été reconnue.
    return ''
}
