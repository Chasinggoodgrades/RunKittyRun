class BigNum {
    public List: BigNumL
    public Base: number

    // Constructor
    public BigNum(baseValue: number) {
        List = null
        Base = baseValue
    }

    // Clean method
    public Clean() {
        let current: BigNumL = List
        _ = current?.Clean()
    }

    // DivSmall method
    public DivSmall(denom: number) {
        return List?.DivSmall(Base, denom) ?? 0
    }

    // LastDigit method
    public LastDigit(): number {
        let current: BigNumL = List
        while (current?.Next != null) {
            current = current.Next
        }
        return current?.Leaf ?? 0
    }
}

class BigNumL {
    public Leaf: number
    public Next: BigNumL
    private static _nalloc: number = 0

    // Constructor
    public BigNumL() {
        Next = null
        Leaf = 0
        _nalloc++
    }

    public static Create(): BigNumL {
        return new BigNumL()
    }

    public Clean(): boolean {
        if (Next == null && Leaf == 0) {
            return true
        } else if (Next != null && Next.Clean()) {
            Next = null
            return Leaf == 0
        } else {
            return false
        }
    }

    public DivSmall(baseValue: number, denom: number) {
        let remainder: number = 0
        let num: number

        if (Next != null) {
            remainder = Next.DivSmall(baseValue, denom)
        }

        num = Leaf + remainder * baseValue
        let quotient: number = num / denom
        remainder = num - quotient * denom
        Leaf = quotient
        return remainder
    }
}
