using System;
using System.Collections.Generic;

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

    // Destructor
    ~BigNum()
    {
        BigNumL current = List;
        while (current != null)
        {
            BigNumL next = current.Next;
            current = null;
            current = next;
        }
    }

    // Static create method
    public static BigNum Create(int baseValue)
    {
        return new BigNum(baseValue);
    }

    // IsZero method
    public bool IsZero()
    {
        BigNumL current = List;
        while (current != null)
        {
            if (current.Leaf != 0)
                return false;
            current = current.Next;
        }
        return true;
    }

    // Dump method
    public void Dump()
    {
        BigNumL current = List;
        string result = "";
        while (current != null)
        {
            result = current.Leaf + " " + result;
            current = current.Next;
        }
        Console.WriteLine(result);
    }

    // Clean method
    public void Clean()
    {
        BigNumL current = List;
        current?.Clean();
    }

    // AddSmall method
    public void AddSmall(int carry)
    {
        if (List == null)
        {
            List = BigNumL.Create();
        }

        BigNumL current = List;
        int sum;

        while (carry != 0)
        {
            sum = current.Leaf + carry;
            carry = sum / Base;
            sum = sum - carry * Base;
            current.Leaf = sum;

            if (current.Next == null)
            {
                current.Next = BigNumL.Create();
            }
            current = current.Next;
        }
    }

    // MulSmall method
    public void MulSmall(int x)
    {
        BigNumL current = List;
        int product;
        int remainder;
        int carry = 0;

        while (current != null || carry != 0)
        {
            product = x * (current?.Leaf ?? 0) + carry;
            carry = product / Base;
            remainder = product - carry * Base;
            if (current != null) current.Leaf = remainder;

            if (current?.Next == null && carry != 0)
            {
                current.Next = BigNumL.Create();
            }
            current = current?.Next;
        }
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

    // Destructor
    ~BigNumL()
    {
        _nalloc--;
    }

    // Static create method
    public static BigNumL Create()
    {
        return new BigNumL();
    }

    // Clean method
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

    // DivSmall method
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

    // For debugging, get the current allocation count
    public static int GetNAlloc()
    {
        return _nalloc;
    }

}
