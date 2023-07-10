import { debug } from '../logging'
import { Asset, AssetType } from '../types'
import { StockValueData, StockChangeData, isStockChangeDelta, isStockChangeFixed } from '../types/assets'
import { isCurrency } from '../types/common'

/**
 * A single asset value and amount on the particular moment.
 */
export interface AssetRecord {
  time: Date
  amount: number
  value: number
}

/**
 * Valid types for asset bookkeeping.
 */
export type AssetStockType = 'crypto' | 'stock' | 'currency' | 'other'
export function isAssetStockType(obj: unknown): obj is AssetStockType {
  return typeof obj === 'string' && ['crypto', 'stock', 'currency', 'other'].includes(obj)
}

/**
 * Collection of assets in timeline.
 */
export type AssetStock = Record<AssetStockType, Partial<Record<Asset, AssetRecord[]>>>

/**
 * A class for storing and lookup for current stock and value of different assets in timeline.
 */
export class StockBookkeeping {
  stock: AssetStock
  name: string // Used mainly for debugging purposes.

  constructor(name = 'No name') {
    this.name = name
    this.reset()
    debug('STOCK', `[${this.name}]: Created new stock bookkeeper.`)
  }

  /**
   * Nullify data.
   */
  reset(): void {
    this.stock = {
      crypto: {},
      stock: {},
      currency: {},
      other: {}
    }
  }

  /**
   * Set the fixed value of stock for given time stamp.
   * @param time
   * @param type
   * @param asset
   * @param amount
   * @param value
   */
  set(time: Date, type: AssetType, asset: Asset, amount: number, value: number): void {
    if (typeof time === 'string') {
      time = new Date(time)
    }
    if (!(asset in this.stock[type])) {
      this.stock[type][asset] = []
    }
    const stock: AssetRecord[] = this.stock[type][asset] || [] // Fool the compiler.
    stock.push({
      time,
      amount,
      value
    })
    this.stock[type][asset] = stock.sort((a, b) => a.time.getTime() - b.time.getTime())
    debug('STOCK', `[${this.name}] ${time.toISOString()}: Set ${type} ${asset} = ${amount} (${value}).`)
  }

  /**
   * Check if asset has recordings.
   * @param type
   * @param asset
   * @returns
   */
  has(type: AssetType, asset: Asset): boolean {
    return isAssetStockType(type) ? asset in this.stock[type] : false
  }

  /**
   * Get the last entry for asset.
   * @param type
   * @param asset
   */
  last(type: AssetType, asset: Asset): AssetRecord & { time: Date } {
    const stock: AssetRecord[] = this.stock[type][asset] || [] // Fool the compiler.
    if (!stock || !stock.length) {
      throw new Error(`There is no asset ${asset} of ${type} in stock bookkeeping.`)
    }
    return stock[stock.length - 1]
  }

  /**
   * Append a change in value for an asset.
   * @param time
   * @param type
   * @param asset
   * @param amount
   * @param delta
   */
  change(time: Date, type: AssetType, asset: Asset, amount: number, value: number): void {
    const originalAmount = amount
    const originalValue = value
    if (typeof time === 'string') {
      time = new Date(time)
    }
    if (!this.has(type, asset)) {
      this.set(time, type, asset, amount, value)
    } else {
      const last = this.last(type, asset)
      if (time < last.time) {
        debug('STOCK', this.stock)
        throw new Error(`Cannot insert ${type} ${asset} at ${time.toISOString()}, since last timestamp is ${last.time.toISOString()}`)
      }
      amount += last.amount
      value += last.value
      const stock: AssetRecord[] = this.stock[type][asset] || [] // Fool the compiler.
      stock.push({
        time,
        amount,
        value
      })
      debug('STOCK', `[${this.name}] ${time.toISOString()}: Change ${type} ${asset} Δ ${originalAmount >= 0 ? '+' : ''}${originalAmount} (${originalValue >= 0 ? '+' : ''}${originalValue}) ⇒ ${amount} ${asset} (${value})`)
    }
  }

  /**
   * Find the stock at the given timestamp.
   * @param time
   * @param type
   * @param asset
   */
  get(time: Date, type: AssetType, asset: Asset): AssetRecord {
    let i

    const stock: AssetRecord[] = this.stock[type][asset] || []

    if (this.has(type, asset)) {
      i = stock.length - 1
    } else {
      i = -1
    }

    while (i >= 0 && stock[i].time > time) {
      i--
    }

    return i < 0 ? {
      time,
      amount: 0.0,
      value: 0.0
    } : stock[i]
  }

  /**
   * Try to figure out asset type based on common knowledge and what we have currently.
   * @param asset
   */
  getType(asset): AssetType {
    if (isCurrency(asset)) {
      return 'currency'
    }
    if (this.stock.crypto[asset]) {
      return 'crypto' as AssetType
    }
    if (this.stock.stock[asset]) {
      return 'stock' as AssetType
    }
    return 'other'
  }

  /**
   * Apply stock change data used in transaction asset bookkeeping.
   * @param data
   */
  apply(time: Date, data: StockChangeData): void {
    if (typeof time === 'string') {
      time = new Date(time)
    }
    if (isStockChangeFixed(data)) {
      Object.keys(data.stock.set).forEach(asset => {
        const { amount, value } = data.stock.set[asset]
        this.set(time, this.getType(asset), asset as Asset, amount, value)
      })
    }
    if (isStockChangeDelta(data)) {
      Object.keys(data.stock.change).forEach(asset => {
        const { amount, value } = data.stock.change[asset]
        this.change(time, this.getType(asset), asset as Asset, amount, value)
      })
    }
  }

  /**
   * Apply multiple stock change data entries at once.
   * @param data
   */
  applyAll(data: { data: StockChangeData, time: Date }[ ]): void {
    data.forEach((entry) => this.apply(entry.time, entry.data))
  }

  /**
   * Get the list of changed asset names in the given stock change data.
   * @param data
   */
  changedAssets(data: StockChangeData): Asset[] {
    const assets: Set<Asset> = new Set()
    if (isStockChangeDelta(data)) {
      Object.keys(data.stock.change).forEach(asset => assets.add(asset as Asset))
    }
    if (isStockChangeFixed(data)) {
      Object.keys(data.stock.set).forEach(asset => assets.add(asset as Asset))
    }
    return [...assets]
  }

  /**
   * Collect all assets that has recordings.
   */
  assets(): [AssetType, Asset][] {
    const ret: [AssetType, Asset][] = []
    Object.keys(this.stock).map(
      type => Object.keys(this.stock[type]).forEach(
        asset => ret.push([type as AssetType, asset as Asset])
      )
    )
    return ret
  }

  /**
   * Collect the latest totals of all assets.
   */
  totals(): [AssetType, Asset, number][] {
    return this.assets().map(([type, asset]) => [type, asset, this.last(type, asset).amount])
  }

  /**
   * Get the latest total of one asset.
   * @param type
   * @param asset
   * @returns
   */
   total(type: AssetType | Asset, asset: Asset | undefined = undefined): number {
    if (!asset) {
      asset = type as Asset
      type = this.getType(asset)
    }
    return this.has(type as AssetType, asset) ? this.last(type as AssetType, asset).amount : 0.0
  }

  /**
   * Get the latest value of one asset.
   * @param type
   * @param asset
   * @returns
   */
   value(type: AssetType | Asset, asset: Asset | undefined = undefined): number {
    if (!asset) {
      asset = type as Asset
      type = this.getType(asset)
    }
    return this.has(type as AssetType, asset) ? this.last(type as AssetType, asset).value : 0.0
  }

  /**
   * Collect full stock summary.
   */
  summary(roundToZero: null | number = null, addType = true, addTime = true) {
    const result: Record<string, StockValueData & { time?: Date} > = {}
    if (addType) {
      // With type.
      for (const [type, asset] of this.assets()) {
        result[`${type}.${asset}`] = this.last(type, asset)
        if (!addTime) {
          delete result[`${type}.${asset}`].time
        }
        if (roundToZero) {
          if (Math.abs(result[`${type}.${asset}`].amount) < roundToZero) {
            delete result[`${type}.${asset}`]
          }
        }
      }
    } else {
      // Without type.
      for (const [type, asset] of this.assets()) {
        result[asset] = this.last(type, asset)
        if (!addTime) {
          delete result[asset].time
        }
        if (roundToZero) {
          if (Math.abs(result[asset].amount) < roundToZero) {
            delete result[asset]
          }
        }
      }
    }
    return result
  }

  /**
   * Gather simple summary per ticker.
   */
  toJSON(): Partial<Record<Asset, number>> {
    const sum: Partial<Record<Asset, number>> = {}
    for (const [, asset, amount] of this.totals()) {
      sum[asset] = (sum[asset] || 0) + amount
    }
    return sum
  }
}
