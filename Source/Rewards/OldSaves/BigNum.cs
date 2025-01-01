public class BigNum
{
    public BigNumL List { get; set; }
    public int Base { get; set; }

    // Constructor
    public BigNum(int baseValue)
    {
        List = null;
        Base = baseValue;
    }

    // Clean method
    public void Clean()
    {
        BigNumL current = List;
        current?.Clean();
    }


    // DivSmall method
    public int DivSmall(int denom)
    {
        return List?.DivSmall(Base, denom) ?? 0;
    }

    // LastDigit method
    public int LastDigit()
    {
        BigNumL current = List;
        while (current?.Next != null)
        {
            current = current.Next;
        }
        return current?.Leaf ?? 0;
    }
}

public class BigNumL
{
    public int Leaf { get; set; }
    public BigNumL Next { get; set; }
    private static int _nalloc = 0;

    // Constructor
    public BigNumL()
    {
        Next = null;
        Leaf = 0;
        _nalloc++;
    }

    public static BigNumL Create()
    {
        return new BigNumL();
    }

    public bool Clean()
    {
        if (Next == null && Leaf == 0)
        {
            return true;
        }
        else if (Next != null && Next.Clean())
        {
            Next = null;
            return Leaf == 0;
        }
        else
        {
            return false;
        }
    }

    public int DivSmall(int baseValue, int denom)
    {
        int quotient = 0;
        int remainder = 0;
        int num;

        if (Next != null)
        {
            remainder = Next.DivSmall(baseValue, denom);
        }

        num = Leaf + remainder * baseValue;
        quotient = num / denom;
        remainder = num - quotient * denom;
        Leaf = quotient;
        return remainder;
    }
}
