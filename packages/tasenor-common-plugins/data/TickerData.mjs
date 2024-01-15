#!/usr/bin/env -S npx tsx
import data from 'currency-codes/data'
import commonNode from '@tasenor/common-node'
const { saveJson } = commonNode.dataUtils

const currencies = {}
data.forEach(item => (currencies[item.code] = item.currency))
saveJson('TickerData', 'currencies', currencies)
