export class BigNum {
    public List: BigNumL
    public Base: number

    // Constructor
    public constructor(baseValue: number) {
        this.List = null as never
        this.Base = baseValue
    }

    // Clean method
    public Clean() {
        let current: BigNumL = this.List
        current?.Clean()
    }

    // DivSmall method
    public DivSmall(denom: number) {
        return this.List?.DivSmall(this.Base, denom) ?? 0
    }

    // LastDigit method
    public LastDigit(): number {
        let current: BigNumL = this.List
        while (current?.Next != null) {
            current = current.Next
        }
        return current?.Leaf ?? 0
    }
}

export class BigNumL {
    public Leaf: number
    public Next: BigNumL
    private static _nalloc: number = 0

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
        if (this.Next == null && this.Leaf == 0) {
            return true
        } else if (this.Next != null && this.Next.Clean()) {
            this.Next = null as never
            return this.Leaf == 0
        } else {
            return false
        }
    }

    public DivSmall(baseValue: number, denom: number) {
        let remainder: number = 0
        let num: number

        if (this.Next != null) {
            remainder = this.Next.DivSmall(baseValue, denom)
        }

        num = this.Leaf + remainder * baseValue
        let quotient: number = num / denom
        remainder = num - quotient * denom
        this.Leaf = quotient
        return remainder
    }
}
