export class BigNum {
    public List: BigNumL
    public Base = 0

    // Constructor
    public constructor(baseValue: number) {
        this.List = null as never
        this.Base = baseValue
    }

    // Clean method
    public Clean = () => {
        const current: BigNumL = this.List
        current?.Clean()
    }

    // DivSmall method
    public DivSmall = (denom: number) => {
        return this.List?.DivSmall(this.Base, denom) ?? 0
    }

    // LastDigit method
    public LastDigit(): number {
        let current: BigNumL = this.List
        while (!!current?.Next) {
            current = current.Next
        }
        return current?.Leaf ?? 0
    }
}

export class BigNumL {
    public Leaf = 0
    public Next: BigNumL
    private static _nalloc = 0

    // Constructor
    public constructor() {
        this.Next = null as never
        this.Leaf = 0
        BigNumL._nalloc++
    }

    public static Create(): BigNumL {
        return new BigNumL()
    }

    public Clean(): boolean {
        if (!this.Next && this.Leaf === 0) {
            return true
        } else if (this.Next && this.Next.Clean()) {
            this.Next = null as never
            return this.Leaf === 0
        } else {
            return false
        }
    }

    public DivSmall = (baseValue: number, denom: number) => {
        let remainder = 0

        if (!!this.Next) {
            remainder = this.Next.DivSmall(baseValue, denom)
        }

        const num = this.Leaf + remainder * baseValue
        const quotient: number = num / denom
        remainder = num - quotient * denom
        this.Leaf = quotient
        return remainder
    }
}
