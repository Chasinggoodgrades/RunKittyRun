class Cell {
    public readonly X: number
    public readonly Y: number

    public constructor(x: number, y: number) {
        this.X = x
        this.Y = y
    }
}

class ItemSpatialGrid {
    private CELL_SIZE: number = 128
    private static Dictionary<Cell, Kibble[]> kibbleCells = new();
    private static Dictionary<Cell, item[]> itemCells = new();

    public static GetCell(x: number, y: number): Cell {
        let cellX: number = x / CELL_SIZE
        let cellY: number = y / CELL_SIZE
        return new Cell(cellX, cellY)
    }

    public static RegisterKibble(kibble: Kibble) {
        let cell = GetCell(kibble.Item.X, kibble.Item.Y)
        let list: Kibble[]
        if (!(list = kibbleCells.TryGetValue(cell)) /* TODO; Prepend: let */) kibbleCells[cell] = list = []
        list.Add(kibble)
    }

    public static UnregisterKibble(kibble: Kibble) {
        let cell = GetCell(kibble.Item.X, kibble.Item.Y)
        if ((list = kibbleCells.TryGetValue(cell)) /* TODO; Prepend: let */) list.Remove(kibble)
    }

    public static RegisterItem(item: item) {
        let cell = GetCell(item.X, item.Y)
        let list: Kibble[]
        if (!(list = itemCells.TryGetValue(cell)) /* TODO; Prepend: let */) itemCells[cell] = list = []
        list.Add(item)
    }

    public static UnregisterItem(item: item) {
        let cell = GetCell(item.X, item.Y)
        if ((list = itemCells.TryGetValue(cell)) /* TODO; Prepend: let */) list.Remove(item)
    }

    public static GetNearbyKibbles(x: number, y: number): Kibble[] {
        let cell = GetCell(x, y)
        if ((list = kibbleCells.TryGetValue(cell)) /* TODO; Prepend: let */) return list
        return null
    }

    public static GetNearbyItems(x: number, y: number): item[] {
        let cell = GetCell(x, y)
        if ((list = itemCells.TryGetValue(cell)) /* TODO; Prepend: let */) return list
        return null
    }

    public static KittyItemPickup(kitty: Kitty) {
        let kibbleList = GetNearbyKibbles(kitty.Unit.X, kitty.Unit.Y)
        let itemList = GetNearbyItems(kitty.Unit.X, kitty.Unit.Y)

        if (kibbleList != null && kibbleList.Count > 0) {
            for (let i: number = 0; i < kibbleList.Count; i++) {
                let k = kibbleList[i]
                if (k == null) continue
                kitty.Unit.AddItem(k.Item)
            }
        }

        if (itemList != null && itemList.Count > 0) {
            for (let i: number = 0; i < itemList.Count; i++) {
                let item = itemList[i]
                if (item == null) continue
                if (item.IsOwned) continue
                kitty.Unit.AddItem(item)
                break
            }
        }
    }
}
