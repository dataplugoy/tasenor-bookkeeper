#!/usr/bin/env -S npx tsx
/**
 * A tool to get currency rate from local server using sevices.
 */
import { ArgumentParser } from 'argparse'
import services from '../src/lib/services'

async function main() {

  const parser = new ArgumentParser({
    description: 'Get currency rate'
  })
  parser.addArgument('currency')
  parser.addArgument('date')
  const args = parser.parseArgs()

  const result = await services.getCurrencyRate(args.currency, 'EUR', args.date)
  console.log(result)
}

await main()
