import dayjs from 'dayjs'
import { ExpenseSink, IncomeSource, ShortDate } from '..'
import { LinkedTree, emptyLinkedTree, VATTarget, KnowledgeBase, KnowledgeType, KnowledgeNodeType, VATRange, VATTable } from '../types/knowledge'

/**
 * A container for static public data collected from plugins.
 */
export class Knowledge {

  private data: KnowledgeBase

  constructor(init?: KnowledgeBase) {
    if (init === undefined) {
      init = {
        income: {
          root: null,
          children: {},
          parents: {}
        },
        expense: {
          root: null,
          children: {},
          parents: {}
        },
        assetCodes: {
          root: null,
          children: {},
          parents: {}
        },
        taxTypes: [],
        vat: [
        ]
      }
    }
    this.data = init
  }

  /**
   * Update some or all data of the knowledge base.
   * @param data
   */
  update(data: Partial<KnowledgeBase>) {
    Object.assign(this.data, data)
  }

  /**
   * Check if the target is income.
   * @param target
   */
  isIncome(target: unknown): target is IncomeSource {
    if (!this.data.income) {
      throw new Error(`Cannot look for income ${target} since no income classification loaded.`)
    }
    return (typeof target === 'string') && (target in this.data.income.parents)
  }

  /**
   * Check if the target is income.
   * @param target
   */
  isExpense(target: unknown): target is ExpenseSink {
    if (!this.data.expense) {
      throw new Error(`Cannot look for expense ${target} since no expense classification loaded.`)
    }
    return (typeof target === 'string') && (target in this.data.expense.parents)
  }

  /**
   * Scan tree parents upwards until a value is found from the lookup table.
   * @param id
   * @param table
   * @param tree
   * @returns
   */
  treeLookup<T extends string | number | symbol, R>(id: T, table: Partial<Record<T, R>>, tree: LinkedTree<T>): R | null | undefined {
    if (id in table) {
      return table[id]
    }
    if (id in tree.parents) {
      const parent = tree.parents[id]
      if (parent !== undefined && parent !== null) {
        return this.treeLookup(parent, table, tree)
      }
    }
    return null
  }

  /**
   * Find a VAT definitions for the given data.
   * @param date
   */
  findVatRange(date?: Date | ShortDate): VATRange | null {
    if (!this.data.vat) {
      throw new Error('Cannot look for VAT since no VAT data loaded.')
    }
    if (!date) {
      date = new Date()
    }
    if (date instanceof Date) {
      date = dayjs(date).format('YYYY-MM-DD')
    }
    for (let i = 0; i < this.data.vat.length; i++) {
      const { from, to } = this.data.vat[i]
      if (from <= date && (to === null || date <= to)) {
        return this.data.vat[i]
      }
    }
    return null
  }

  /**
   * Perform lookup for a VAT.
   * @param target
   */
  vat(target: VATTarget, date?: Date | ShortDate): number | null | undefined {
    if (!target) {
      return null
    }
    target = target.replace(/[0-9]+$/, '') as VATTarget
    const vat = this.findVatRange(date)
    if (!vat) {
      return null
    }
    if (this.isIncome(target)) {
      return this.treeLookup(target, vat.percentage, this.data.income)
    }
    if (this.isExpense(target)) {
      return this.treeLookup(target, vat.percentage, this.data.expense)
    }
    return null
  }

  /**
   * Construct a table presentation of the all income and expense entries that have setting for VAT.
   * @param date
   */
  vatTable(date?: Date | ShortDate): VATTable {
    if (!date) {
      date = new Date()
    }

    const vat = this.findVatRange(date)
    if (!vat) {
      return []
    }

    // Create tree for collecting updates.
    const tree = {}
    Object.entries(this.data.income.parents).forEach(([item, parent]) => {
      const value = item in vat.percentage ? vat.percentage[item] : undefined
      tree[item] = {
        name: item,
        type: 'income',
        parent,
        children: [],
        handled: false,
        collected: false,
        value
      }
    })
    Object.entries(this.data.expense.parents).forEach(([item, parent]) => {
      const value = item in vat.percentage ? vat.percentage[item] : undefined
      tree[item] = {
        name: item,
        type: 'expense',
        parent,
        children: [],
        handled: false,
        collected: false,
        value
      }
    })

    // Function to scan a branch all the way to the root unless handled node found first.
    const handle = (id) => {
      if (!tree[id]) {
        throw new Error(`Reference to undefined VAT ID: '${id}''.`)
      }
      if (tree[id].handled) {
        return tree[id].value
      }
      const parent = tree[id].parent
      if (parent) {
        const parentValue = handle(parent)
        if (tree[id].value === undefined) {
          tree[id].value = parentValue
        }
        tree[parent].children.push(id)
      }
      tree[id].handled = true
      return tree[id].value
    }

    // Force handling for all existing values.
    Object.keys(vat.percentage).forEach(id => {
      handle(id)
    })

    // Build a final tree for those that have values.
    const result: VATTable = []
    const collect = (id, level = 0) => {
      if (tree[id].collected) {
        return
      }
      result.push({
        id,
        name: `${tree[id].type}-${id}`,
        level,
        value: tree[id].value
      })
      tree[id].collected = true
      tree[id].children.forEach(child => collect(child, level + 1))
    }
    Object.keys(tree).forEach(key => {
      if (tree[key].handled && !tree[key].collected) {
        collect(key)
      }
    })

    return result
  }

  /**
   * Give entry count for each kind of information.
   */
  count(): Record<KnowledgeType, number> {
    return {
      assets: Object.keys(this.data.assetCodes.parents).length,
      income: Object.keys(this.data.income.parents).length,
      expense: Object.keys(this.data.expense.parents).length,
      vat: this.data.vat.length
    }
  }

  /**
   * Find the tree where a code belongs to.
   * @param code
   * @returns
   */
  findTree(code: KnowledgeNodeType): LinkedTree<KnowledgeNodeType> {
    if (code in this.data.assetCodes.parents) {
      return this.data.assetCodes
    }
    if (code in this.data.income.parents) {
      return this.data.income
    }
    if (code in this.data.expense.parents) {
      return this.data.expense
    }
    return emptyLinkedTree()
  }

  /**
   * Resolve recursively all children for the code.
   * @param code
   * @param tree
   * @returns
   */
  children(code: KnowledgeNodeType, tree: LinkedTree<KnowledgeNodeType> | undefined = undefined): KnowledgeNodeType[] {
    const t = tree || this.findTree(code)
    if (code in t.children) {
      let ret = t.children[code] as KnowledgeNodeType[]
      for (const child of ret) {
        ret = ret.concat(this.children(child, t))
      }
      return ret
    }
    return []
  }
}
