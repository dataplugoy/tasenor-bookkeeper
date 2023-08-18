/**
 * Type definitions for knowledge base management.
 */
import { AssetCode } from './assetCodes'
import { Asset, TaxType } from './assets'
import { ExpenseSink } from './expense'
import { IncomeSource } from './income'
import { ShortDate } from './time'

/**
 * Types that can have some value for VAT percentage.
 */
export type VATTarget = ExpenseSink | IncomeSource

/**
 * Known knowledge linked tree node value types.
 */
export type KnowledgeNodeType = string | number | symbol | Asset

/**
 * A tree structure for fast lookup.
 */
export interface LinkedTree<NodeType extends KnowledgeNodeType = string> {
  root: NodeType | null,
  children: Partial<Record<NodeType, NodeType[]>>
  parents: Partial<Record<NodeType, NodeType | null>>
}

/**
 * Generate empty linked tree.
 */
export function emptyLinkedTree<T extends KnowledgeNodeType>(): LinkedTree<T> {
  return {
    root: null,
    children: {},
    parents: {}
  }
}

/**
 * An entry describing VATs for various income and expense IDs VAT for date range.
 * For currently valid data, end date `to` is set to null.
 */
export interface VATRange {
  from: ShortDate
  to: ShortDate | null
  percentage: Partial<Record<VATTarget, number>>
}

/**
 * VAT information table organized so that each parent lists their children under them.
 */
export type VATTable = {
  id: VATTarget
  name: string
  level: number
  value: number
}[]

/**
 * Types of knowledge collections.
 */
export type KnowledgeType = 'income' | 'expense' | 'assets' | 'vat'

/**
 * A type for complete knowledge base filled by various plugins.
 */
export type KnowledgeBase = {
  income: LinkedTree<IncomeSource>
  expense: LinkedTree<ExpenseSink>
  assetCodes: LinkedTree<AssetCode>
  taxTypes: TaxType[]
  vat: VATRange[]
}
