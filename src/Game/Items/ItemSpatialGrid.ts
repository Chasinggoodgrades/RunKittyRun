import { Item } from 'w3ts'
import { Kitty } from '../Entities/Kitty/Kitty'
import { Kibble } from './Kibble'

export class ItemSpatialGrid {
    private static CELL_SIZE = 128
    private static kibbleCells: Map<string, Kibble[]> = new Map()
    private static itemCells: Map<string, Item[]> = new Map()

    private static getCellKey(x: number, y: number): string {
        const cellX = Math.floor(x / ItemSpatialGrid.CELL_SIZE)
        const cellY = Math.floor(y / ItemSpatialGrid.CELL_SIZE)
        return `${cellX},${cellY}`
    }

    public static RegisterKibble = (kibble: Kibble) => {
        if (!kibble.Item) return // If the item is not valid... no reason to register i guess
        const cellKey = ItemSpatialGrid.getCellKey(kibble.Item.x, kibble.Item.y)
        let list = ItemSpatialGrid.kibbleCells.get(cellKey)
        if (!list) ItemSpatialGrid.kibbleCells.set(cellKey, (list = []))
        list.push(kibble)
    }

    public static UnregisterKibble = (kibble: Kibble) => {
        if (!kibble.Item) return // If the item is not valid... no reason to unregister i guess
        const cellKey = ItemSpatialGrid.getCellKey(kibble.Item.x, kibble.Item.y)
        const list = ItemSpatialGrid.kibbleCells.get(cellKey) || []

        ItemSpatialGrid.kibbleCells.set(
            cellKey,
            list.filter(i => i !== kibble)
        )
    }

    public static RegisterItem = (item: Item) => {
        const cellKey = ItemSpatialGrid.getCellKey(item.x, item.y)
        let list: Item[]
        if (!(list = ItemSpatialGrid.itemCells.get(cellKey)!)) ItemSpatialGrid.itemCells.set(cellKey, (list = []))
        list.push(item)
    }

    public static UnregisterItem = (item: Item) => {
        if (!item) return // If the item is not valid... no reason to unregister i guess
        const cellKey = ItemSpatialGrid.getCellKey(item.x, item.y)
        const list = ItemSpatialGrid.itemCells.get(cellKey) || []

        ItemSpatialGrid.itemCells.set(
            cellKey,
            list.filter(i => i !== item)
        )
    }

    public static GetNearbyKibbles = (x: number, y: number) => {
        const cellKey = ItemSpatialGrid.getCellKey(x, y)
        const list = ItemSpatialGrid.kibbleCells.get(cellKey)
        if (list) return list
        return null
    }

    public static GetNearbyItems = (x: number, y: number) => {
        const cellKey = ItemSpatialGrid.getCellKey(x, y)
        const list = ItemSpatialGrid.itemCells.get(cellKey)
        if (list) return list
        return null
    }

    public static KittyItemPickup = (kitty: Kitty) => {
        const kibbleList = ItemSpatialGrid.GetNearbyKibbles(kitty.Unit.x, kitty.Unit.y)
        const itemList = ItemSpatialGrid.GetNearbyItems(kitty.Unit.x, kitty.Unit.y)

        if (kibbleList && kibbleList.length > 0) {
            for (let i = 0; i < kibbleList.length; i++) {
                const k = kibbleList[i]
                if (!k?.Item) continue
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
