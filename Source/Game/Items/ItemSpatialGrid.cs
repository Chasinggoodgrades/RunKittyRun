using System.Collections.Generic;
using WCSharp.Api;

public static class ItemSpatialGrid
{
    private const float CELL_SIZE = 128f;
    private const int GRID_WIDTH = 64;
    private const int GRID_HEIGHT = 64;
    private const int X_OFFSET = 32;
    private const int Y_OFFSET = 32;
    private const int INVALID_CELL = -1;

    private static readonly List<Kibble>[] kibbleCells = new List<Kibble>[GRID_WIDTH * GRID_HEIGHT];
    private static readonly List<item>[] itemCells = new List<item>[GRID_WIDTH * GRID_HEIGHT];

    private static int GetCellIndex(float x, float y)
    {
        int cellX = (int)(x / CELL_SIZE) + X_OFFSET;
        int cellY = (int)(y / CELL_SIZE) + Y_OFFSET;
        if (cellX < 0 || cellX >= GRID_WIDTH || cellY < 0 || cellY >= GRID_HEIGHT)
            return INVALID_CELL;
        return cellY * GRID_WIDTH + cellX;
    }

    public static void RegisterKibble(Kibble kibble)
    {
        int index = GetCellIndex(kibble.Item.X, kibble.Item.Y);
        if (index == INVALID_CELL) return;
        if (kibbleCells[index] == null)
            kibbleCells[index] = new List<Kibble>();
        kibbleCells[index].Add(kibble);
    }

    public static void UnregisterKibble(Kibble kibble)
    {
        int index = GetCellIndex(kibble.Item.X, kibble.Item.Y);
        if (index == INVALID_CELL) return;
        kibbleCells[index]?.Remove(kibble);
    }

    public static void RegisterItem(item item)
    {
        int index = GetCellIndex(item.X, item.Y);
        if (index == INVALID_CELL) return;
        if (itemCells[index] == null)
            itemCells[index] = new List<item>();
        itemCells[index].Add(item);
    }

    public static void UnregisterItem(item item)
    {
        int index = GetCellIndex(item.X, item.Y);
        if (index == INVALID_CELL) return;
        itemCells[index]?.Remove(item);
    }

    public static List<Kibble> GetNearbyKibbles(float x, float y)
    {
        int index = GetCellIndex(x, y);
        if (index == INVALID_CELL) return null;
        return kibbleCells[index];
    }

    public static List<item> GetNearbyItems(float x, float y)
    {
        int index = GetCellIndex(x, y);
        if (index == INVALID_CELL) return null;
        return itemCells[index];
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
