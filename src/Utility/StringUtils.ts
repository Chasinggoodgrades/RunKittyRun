export const isNullOrEmpty = (str: string | null | undefined) => {
    return !str || str.trim().length === 0
}
