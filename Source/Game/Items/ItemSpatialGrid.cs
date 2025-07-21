using System.Collections.Generic;
using WCSharp.Api;


public readonly struct Cell
{
    public readonly int X;
    public readonly int Y;

    public Cell(int x, int y)
    {
        X = x;
        Y = y;
    }
}

public static class ItemSpatialGrid
{
    private const float CELL_SIZE = 128f;
    private static Dictionary<Cell, List<Kibble>> kibbleCells = new();
    private static Dictionary<Cell, List<item>> itemCells = new();

    public static Cell GetCell(float x, float y)
    {
        int cellX = (int)(x / CELL_SIZE);
        int cellY = (int)(y / CELL_SIZE);
        return new Cell(cellX, cellY);
    }

    public static void RegisterKibble(Kibble kibble)
    {
        var cell = GetCell(kibble.Item.X, kibble.Item.Y);
        if (!kibbleCells.TryGetValue(cell, out var list))
            kibbleCells[cell] = list = new List<Kibble>();
        list.Add(kibble);
    }

    public static void UnregisterKibble(Kibble kibble)
    {
        var cell = GetCell(kibble.Item.X, kibble.Item.Y);
        if (kibbleCells.TryGetValue(cell, out var list))
            list.Remove(kibble);
    }

    public static void RegisterItem(item item)
    {
        var cell = GetCell(item.X, item.Y);
        if (!itemCells.TryGetValue(cell, out var list))
            itemCells[cell] = list = new List<item>();
        list.Add(item);
    }

    public static void UnregisterItem(item item)
    {
        var cell = GetCell(item.X, item.Y);
        if (itemCells.TryGetValue(cell, out var list))
            list.Remove(item);
    }

    public static List<Kibble> GetNearbyKibbles(float x, float y)
    {
        var cell = GetCell(x, y);
        if (kibbleCells.TryGetValue(cell, out var list))
            return list;
        return null;
    }

    public static List<item> GetNearbyItems(float x, float y)
    {
        var cell = GetCell(x, y);
        if (itemCells.TryGetValue(cell, out var list))
            return list;
        return null;
    }

    public static void KittyItemPickup(Kitty kitty)
    {
        var kibbleList = GetNearbyKibbles(kitty.Unit.X, kitty.Unit.Y);
        var itemList = GetNearbyItems(kitty.Unit.X, kitty.Unit.Y);

        if (kibbleList != null && kibbleList.Count > 0)
        {
            for (int i = 0; i < kibbleList.Count; i++)
            {
                var k = kibbleList[i];
                if (k == null) continue;
                kitty.Unit.AddItem(k.Item);
            }
        }

        if (itemList != null && itemList.Count > 0)
        {
            for (int i = 0; i < itemList.Count; i++)
            {
                var item = itemList[i];
                if (item == null) continue;
                if (item.IsOwned) continue;
                kitty.Unit.AddItem(item);
                break;
            }
        }
    }
}
