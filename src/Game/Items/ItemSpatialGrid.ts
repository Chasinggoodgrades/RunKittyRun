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
        const cellX: number = x / ItemSpatialGrid.CELL_SIZE
        const cellY: number = y / ItemSpatialGrid.CELL_SIZE
        return new Cell(cellX, cellY)
    }

    public static RegisterKibble = (kibble: Kibble) => {
        const cell = ItemSpatialGrid.GetCell(kibble.Item.x, kibble.Item.y)
        let list: Kibble[]
        if (!(list = ItemSpatialGrid.kibbleCells.get(cell)!)) ItemSpatialGrid.kibbleCells.set(cell, (list = []))
        list.push(kibble)
    }

    public static UnregisterKibble = (kibble: Kibble) => {
        if (!kibble.Item) return // If the item is not valid... no reason to unregister i guess
        const cell = ItemSpatialGrid.GetCell(kibble.Item.x, kibble.Item.y)
        const list = ItemSpatialGrid.kibbleCells.get(cell) || []

        ItemSpatialGrid.kibbleCells.set(
            cell,
            list.filter(i => i !== kibble)
        )
    }

    public static RegisterItem = (item: Item) => {
        const cell = ItemSpatialGrid.GetCell(item.x, item.y)
        let list: Item[]
        if (!(list = ItemSpatialGrid.itemCells.get(cell)!)) ItemSpatialGrid.itemCells.set(cell, (list = []))
        list.push(item)
    }

    public static UnregisterItem = (item: Item) => {
        if (!item) return // If the item is not valid... no reason to unregister i guess
        const cell = ItemSpatialGrid.GetCell(item.x, item.y)
        const list = ItemSpatialGrid.itemCells.get(cell) || []

        ItemSpatialGrid.itemCells.set(
            cell,
            list.filter(i => i !== item)
        )
    }

    public static GetNearbyKibbles = (x: number, y: number) => {
        const cell = ItemSpatialGrid.GetCell(x, y)
        const list = ItemSpatialGrid.kibbleCells.get(cell)
        if (list) return list
        return null
    }

    public static GetNearbyItems = (x: number, y: number) => {
        const cell = ItemSpatialGrid.GetCell(x, y)
        const list = ItemSpatialGrid.itemCells.get(cell)
        if (list) return list
        return null
    }

    public static KittyItemPickup = (kitty: Kitty) => {
        const kibbleList = ItemSpatialGrid.GetNearbyKibbles(kitty.Unit.x, kitty.Unit.y)
        const itemList = ItemSpatialGrid.GetNearbyItems(kitty.Unit.x, kitty.Unit.y)

        if (kibbleList && kibbleList.length > 0) {
            for (let i = 0; i < kibbleList.length; i++) {
                const k = kibbleList[i]
                if (!k) continue
                kitty.Unit.addItem(k.Item)
            }
        }

        if (itemList && itemList.length > 0) {
            for (let i = 0; i < itemList.length; i++) {
                const item = itemList[i]
                if (!item) continue
                if (item.isOwned()) continue
                kitty.Unit.addItem(item)
                break
            }
        }
    }
}
