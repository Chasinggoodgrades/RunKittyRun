import { Item } from 'w3ts'
import { Kitty } from '../Entities/Kitty/Kitty'
import { Kibble } from './Kibble'

export class Cell {
    public readonly x: number
    public readonly y: number

    public constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

export class ItemSpatialGrid {
    private static CELL_SIZE = 128
    private static kibbleCells: Map<Cell, Kibble[]> = new Map()
    private static itemCells: Map<Cell, Item[]> = new Map()

    public static GetCell(x: number, y: number): Cell {
        let cellX: number = x / ItemSpatialGrid.CELL_SIZE
        let cellY: number = y / ItemSpatialGrid.CELL_SIZE
        return new Cell(cellX, cellY)
    }

    public static RegisterKibble(kibble: Kibble) {
        let cell = ItemSpatialGrid.GetCell(kibble.Item.x, kibble.Item.y)
        let list: Kibble[]
        if (!(list = ItemSpatialGrid.kibbleCells.get(cell)!)) ItemSpatialGrid.kibbleCells.set(cell, (list = []))
        list.push(kibble)
    }

    public static UnregisterKibble(kibble: Kibble) {
        if (!kibble.Item) return // If the item is not valid... no reason to unregister i guess
        let cell = ItemSpatialGrid.GetCell(kibble.Item.x, kibble.Item.y)
        let list = ItemSpatialGrid.kibbleCells.get(cell) || []

        ItemSpatialGrid.kibbleCells.set(
            cell,
            list.filter(i => i !== kibble)
        )
    }

    public static RegisterItem(item: Item) {
        let cell = ItemSpatialGrid.GetCell(item.x, item.y)
        let list: Item[]
        if (!(list = ItemSpatialGrid.itemCells.get(cell)!)) ItemSpatialGrid.itemCells.set(cell, (list = []))
        list.push(item)
    }

    public static UnregisterItem(item: Item) {
        if (!item) return // If the item is not valid... no reason to unregister i guess
        let cell = ItemSpatialGrid.GetCell(item.x, item.y)
        let list = ItemSpatialGrid.itemCells.get(cell) || []

        ItemSpatialGrid.itemCells.set(
            cell,
            list.filter(i => i !== item)
        )
    }

    public static GetNearbyKibbles(x: number, y: number) {
        let cell = ItemSpatialGrid.GetCell(x, y)
        let list = ItemSpatialGrid.kibbleCells.get(cell)
        if (list) return list
        return null
    }

    public static GetNearbyItems(x: number, y: number) {
        let cell = ItemSpatialGrid.GetCell(x, y)
        let list = ItemSpatialGrid.itemCells.get(cell)
        if (list) return list
        return null
    }

    public static KittyItemPickup(kitty: Kitty) {
        let kibbleList = ItemSpatialGrid.GetNearbyKibbles(kitty.Unit.x, kitty.Unit.y)
        let itemList = ItemSpatialGrid.GetNearbyItems(kitty.Unit.x, kitty.Unit.y)

        if (kibbleList !== null && kibbleList.length > 0) {
            for (let i = 0; i < kibbleList.length; i++) {
                let k = kibbleList[i]
                if (k === null) continue
                kitty.Unit.addItem(k.Item)
            }
        }

        if (itemList !== null && itemList.length > 0) {
            for (let i = 0; i < itemList.length; i++) {
                let item = itemList[i]
                if (item === null) continue
                if (item.isOwned()) continue
                kitty.Unit.addItem(item)
                break
            }
        }
    }
}
