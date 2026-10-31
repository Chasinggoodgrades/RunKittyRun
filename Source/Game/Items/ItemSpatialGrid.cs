using System;
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
        int index = GetCellIndex(kibble.X, kibble.Y);
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

    /// <summary>True when a kibble or a free item lies within the radius of the point (the cell and its neighbours are read).</summary>
    public static bool AnythingNear(float x, float y, float radius)
    {
        float r2 = radius * radius;

        for (int dx = -1; dx <= 1; dx++)
        {
            for (int dy = -1; dy <= 1; dy++)
            {
                float cx = x + dx * CELL_SIZE;
                float cy = y + dy * CELL_SIZE;

                var kibbles = GetNearbyKibbles(cx, cy);
                if (kibbles != null)
                {
                    for (int i = 0; i < kibbles.Count; i++)
                    {
                        var k = kibbles[i];
                        if (k?.Item == null) continue;
                        float ddx = k.Item.X - x, ddy = k.Item.Y - y;
                        if (ddx * ddx + ddy * ddy <= r2) return true;
                    }
                }

                var items = GetNearbyItems(cx, cy);
                if (items != null)
                {
                    for (int i = 0; i < items.Count; i++)
                    {
                        var it = items[i];
                        if (it == null || it.IsOwned) continue;
                        float ddx = it.X - x, ddy = it.Y - y;
                        if (ddx * ddx + ddy * ddy <= r2) return true;
                    }
                }
            }
        }

        return false;
    }

    /// <summary>
    /// The unit takes every kibble and the first free item within the radius of a point: how an async
    /// effect picks things up for its hidden unit. Same state on every machine, so same result.
    /// </summary>
    public static void KittyItemPickupAt(Kitty kitty, float x, float y, float radius)
    {
        float r2 = radius * radius;
        var take = new List<item>();
        item firstItem = null;

        for (int dx = -1; dx <= 1; dx++)
        {
            for (int dy = -1; dy <= 1; dy++)
            {
                float cx = x + dx * CELL_SIZE;
                float cy = y + dy * CELL_SIZE;

                var kibbles = GetNearbyKibbles(cx, cy);
                if (kibbles != null)
                {
                    for (int i = 0; i < kibbles.Count; i++)
                    {
                        var k = kibbles[i];
                        if (k?.Item == null) continue;
                        float ddx = k.Item.X - x, ddy = k.Item.Y - y;
                        if (ddx * ddx + ddy * ddy <= r2) take.Add(k.Item);
                    }
                }

                var items = GetNearbyItems(cx, cy);
                if (items != null && firstItem == null)
                {
                    for (int i = 0; i < items.Count; i++)
                    {
                        var it = items[i];
                        if (it == null || it.IsOwned) continue;
                        float ddx = it.X - x, ddy = it.Y - y;
                        if (ddx * ddx + ddy * ddy <= r2) { firstItem = it; break; }
                    }
                }
            }
        }

        // collected first: picking one up changes the lists being read
        for (int i = 0; i < take.Count; i++) kitty.Unit.AddItem(take[i]);
        if (firstItem != null && !firstItem.IsOwned) kitty.Unit.AddItem(firstItem);
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
