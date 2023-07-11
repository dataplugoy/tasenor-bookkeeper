import { TasenorElement, AssetTransfer, isAssetTransfer, Language, RuleParsingError, RulesEngine, TransactionDescription, UIQuery, isUIQueryRef, warning, ImportRule, ImportRuleResult, Currency, AssetTransferReason, debug, error, Tag, ImportSegment, ProcessConfig, SegmentId, TextFileLine, RuleVariables } from '@dataplug/tasenor-common'
import { TransactionUI } from './TransactionUI'
import { TransactionImportHandler } from './TransactionImportHandler'
import clone from 'clone'
import { BadState, SystemError } from '../error'

/**
 * ## Transaction rule system
 *
 * The classification of the import data uses rule system describing how to transform segmented
 * data to *transfers*, i.e. generic description of bookkeeping events. Initially in the beginning
 * of the processing the settings and rules defined for the particular importer are copied to the
 * initial state of the process. During the processing we may ask questions and add more information
 * to the process.
 *
 * So the structure of the configration is
 * ```json
 * {
 *   "language": "fi",
 *   "currency": "EUR",
 *    ...
 *   "account.income.currency.EUR": "1910",
 *    ...
 *   "rules": [...],
 *   "questions": {...},
 *   "answers": {...}
 * }
 * ```
 * There are
 * 1. Generic universal settings like *language* or *currency*.
 * 2. Then there is an account and import setting configuration that has been possibly resolved during the import process
 *    by asking from user, but which will also apply universally afterwards and are copied to the future import
 *    configuration.
 * 3. **Rules** section defines how to map segments to transfers.
 * 4. **Question** section defines UI questions to resolve some cases, that always require user interaction and
 *    cannot be resolved automatically.
 * 5. **Answers** section is a collection of responses to questions stored by each segment. They are not universally
 *    copied to the importer, but are only relevant the current import only.
 *
 * ### Settings
 *
 * The following general settings are used
 * - `currency` - A main currency of the bookkeeping database.
 * - `language` - A translation language for the imported texts.
 * - `tags.*.*.*` - A list of tags to be added for every transaction descriptions. Also some specific tags
 *                  can be specified, since `*.*.*` uses the same convention than account configurations.
 *
 * Accounts are defined as the following.
 * - `account.<reason>.<type>.<asset>` - Defines the account number to be used for the given purpose.
 *                                       Parts can be `'*'` to allow any purpose. Otherwise they are
 *                                       explained in more detail in {@link TransferAnalyzer}.
 *
 * Miscellaneous optional settings:
 * - `isTradeFeePartOfTotal` If set to `true`, assume that trading fee is included in the total.
 *                           Otherwise it is assumed to be paid on the top of the total.
 * - `recordDeposits` If set to false, skip deposits.
 * - `recordWithdrawals` If set to false, skip withdrawls.
 * - `allowShortSelling` If set, allow short selling, i.e. selling assets we don't have.
 *
 * #### Example
 * ```json
 * {
 *   "currency": "EUR",
 *   "language": "en",
 *   "tags.*.*.*": ["Lynx"],
 *   "account.deposit.currency.EUR": "1918",
 *   "account.deposit.external.EUR": "9999",
 *   "account.withdrawal.currency.EUR": "1918",
 *   "account.withdrawal.external.EUR": "9999",
 *   "account.expense.statement.INTEREST_EXPENSE": "9550",
 *   "account.expense.currency.EUR": "1918",
 *
 *   "rules": [],
 *   "questions": [],
 *   "answers": {}
 * }
 * ```
 *
 * ### Rules
 *
 * Rules sections is a list of rule definitions of form
 * ```json
 * {
 *    "name": "Name of the rule",
 *    "filter": "<expression>",
 *    "comment": "<optional description>",
 *    "options": {
 *      <optional flags>
 *    },
 *    "result": [
 *       <transfer1>, <transfer2>...
 *    ]
 * }
 * ```
 * The *name* is any string describing the rule. Rules are used so that each segment resulting from the segmentation
 * step are handled in the order of their timestamps. Lines belonging to the segment are offered one by one to the
 * *filter* expression and if returning true, the entries in *result* are concatenated together. Each entry in the
 * result is a *transfer description*.
 *
 * The filtering and result expressions has various variables set during the processing. All variables from
 * the segmentation is included. Typically they are the same as the column names in the CSV file for example.
 * See {@link TransactionRules.classifyLines} for other variables available.
 *
 * The structure of transfers are explained in {@link TransferAnalyzer}.
 *
 * The syntax of the filter and result is explained in {@link RulesEngine}.
 *
 * Currently one one boolean option is supported: `singleMatch` which means that matching any of the lines in the
 * segment suffices and the parsing result is returned immediately when matching rule is found. The rest of the
 * lines are ignored. It is useful when for example using `sum(lines, 'field')` to gather values from all lines
 * of the segment at once.
 *
 * ### Questions
 *
 * There are situation, where importer cannot deduct some part of the transfer automatically. In that case we can
 * define a question that needs to be answered every time, when the matching rule has been found. For example
 * we may determine based on the transaction data that it is related to computers but we want to know the exact
 * type of the purchase. Then we can define a question
 * ```json
 *   {
 *     "name": "Computer purchase",
 *     "label": "What category is the purchase",
 *     "ask": {
 *       "Hardware equipment": "HARDWARE",
 *       "Software": "SOFTWARE"
 *     }
 *   },
 * ```
 *
 * The question can be used in the transfer as explained in {@link TransferAnalyzer}.
 *
 * Different question types are documented in {@link TransactionUI.parseQuery}.
 *
 * ### Answers
 *
 * This section collects answers given earlier during the processing. They are grouped per segment ID per transfer.
 * For example
 * ```json
 * "d3e89d9af37dda4609bed94770fc5c52be946175": {
 *   "type": "HARDWARE"
 * },
 * ```
 * It may contain also complete transaction definition, which will override all parsing
 * ```
 *   "581e46d024678ddcddc01ae36369bf6fc54f16b2": {
 *     "transfers": [
 *       {
 *         "data": {
 *           "text": "Payment for something"
 *         },
 *         "type": "account",
 *         "asset": "8650",
 *         "amount": 59.27,
 *         "reason": "expense"
 *       },
 *       {
 *         "type": "account",
 *         "asset": "3020",
 *         "amount": -59.27,
 *         "reason": "expense"
 *       }
 *     ]
 *  }
 * ```
 * There is also a global answer section applied to all imports. If an asset has changed its name, it can be
 * stored like this in the empty segment ID:
 * ```
 *   "": {
 *     "asset-renaming": [
 *         {
 *           "date": "<YYYY-MM-DD>"
 *           "type": "stock",
 *           "old": "<OLD ASSET>"
 *           "new": "<NEW ASSET>"
 *         }
 *       ]
 *     }
 *   }
 * ```
 */
export class TransactionRules {
  // TODO: Could also define extension from ProcessConfig configuration type definition and start building precise description.
  //       Most of the use cases in files of this dir, are referring to the import configuration.
  private handler: TransactionImportHandler
  private UI: TransactionUI
  private cache: Record<string, UIQuery>
  constructor(handler: TransactionImportHandler) {
    this.handler = handler
    this.UI = handler.UI
    this.clearCache()
  }

  /**
   * Clear colleciton of named UI questions.
   */
  clearCache() {
    this.cache = {}
  }

  /**
   * Handle query caching.
   * @param query
   *
   * If query has no name, we do nothing. Return query itself.
   * Otherwise it depends if query has anything else but name.
   * For name-only we look from cache and throw error if not found.
   * Otherwise it is saved to cache.
   */
  cachedQuery(query: UIQuery): UIQuery {
    if (query.name) {
      if (isUIQueryRef(query)) {
        if (!this.cache[query.name]) {
          throw new BadState(`Cannot use a reference to question '${query.name}' before it is defined.`)
        }
        return this.cache[query.name]
      } else {
        this.cache[query.name] = query
      }
    }
    return query
  }

  /**
   * Collect answers for questions or if not yet given, throw new query to get them.
   * @param questions
   * @param config
   */
  async getAnswers(segmentId: SegmentId, lines: TextFileLine[], questions: Record<string, UIQuery>, config: ProcessConfig): Promise<Record<string, unknown>> {

    // Check existing answers.
    const language = config.language as Language
    const results: Record<string, unknown> = {}
    const missing: TasenorElement[] = []
    for (let [variable, query] of Object.entries(questions)) {
      query = this.cachedQuery(query)

      const answers: Record<string, Record<string, unknown>> = config.answers as Record<string, Record<string, unknown>> || {}
      if (segmentId in answers && variable in answers[segmentId]) {
        results[variable] = answers[segmentId][variable]
      } else {
        missing.push(await this.UI.parseQuery(`answer.${segmentId}.${variable}`, query, language))
      }
    }

    // If not all answered, ask them.
    if (missing.length) {
      const element: TasenorElement = {
        type: 'flat',
        elements: [
          await this.UI.describeLines(lines, language),
          ...missing,
          await this.UI.submit('Continue', 2, language)
        ]
      }
      this.UI.throw(element)
    }

    return results
  }

  /**
   * Use the rules from the configuration to classify importer transfer lines.
   * @param lines
   * @param config
   * @returns
   *
   * Each rule is checked against each line.
   * For evaluation of the filter expression, all column values of the segment are provided.
   * In addition the following special variables are provided:
   * * `config` - all configuration variables
   * * `rule` - the current rule we are evaluating
   * * `options` - the options of the current rule we are evaluating
   * * `text` - original text of the corresponding line
   * * `lineNumber` - original line number of the corresponding line
   * If the filter match is found, then questions are provided to UI unless already
   * answered. The reponses to the questions are passed to the any further evaluations.
   */
  async classifyLines(lines: TextFileLine[], config: ProcessConfig, segment: ImportSegment): Promise<TransactionDescription> {

    let transfers: AssetTransfer[] = []
    const rules: ImportRule[] = config.rules as ImportRule[] || []
    const engine = new RulesEngine()
    let matched = false

    // Make private copy.
    config = clone(config)
    // Cache questions.
    if (config.questions) {
      (config.questions as UIQuery[]).forEach(q => this.cachedQuery(q))
    }

    debug('RULES', '============================================================')
    debug('RULES', 'Classifying segment', segment.id)
    debug('RULES', '============================================================')

    // Check if we have explicit answer for the segment.
    const explicit = await this.checkExplicitResult(segment, config.answers)
    if (explicit) {
      return explicit
    }

    try {

      const lineValues = lines.map(line => clone(line.columns))

      let index = 0
      for (const line of lines) {
        let lineHasMatch = false

        const columns = lineValues[index++]

        debug('RULES', '-----------------------------------------------------')
        debug('RULES', line.text)
        debug('RULES', '-----------------------------------------------------')
        debug('RULES', columns)

        // Find the rule that has matching filter expression.
        for (let rule of rules) {

          rule = clone(rule)

          const values: RuleVariables = {
            ...columns,
            lines: lineValues,
            config,
            rule,
            options: rule.options || {},
            text: line.text,
            lineNumber: line.line
          }

          const singleMatch = rule.options && rule.options.singleMatch

          if (engine.eval(rule.filter, values)) {
            debug('RULES', 'Rule', rule.name, 'with filter', rule.filter, 'matches.')
            matched = true
            lineHasMatch = true
            // Check that result is defined.
            if (!rule.result) {
              throw new BadState(`The rule ${JSON.stringify(rule)} has no result section.`)
            }
            // We have found the match. Now construct transfers from the rule.
            const answers = rule.questions ? await this.getAnswers(segment.id, lines, rule.questions, config) : {}

            // Replace cached queries to the variables passed to the rule engine.
            if (rule.questions) {
              const q = rule.questions as Record<string, UIQuery<unknown>>
              Object.keys(q).forEach(key => {
                q[key] = this.cachedQuery(q[key])
              })
            }

            transfers = transfers.concat(this.parseResults(engine, lines, rule, values, answers as RuleVariables))

            // Continue to next line unless single match.
            if (singleMatch) {
              return await this.postProcess(segment, {
                type: 'transfers',
                transfers
              })
            }
            break

          } // if (engine.eval(rule.filter, values))

        } // for (let rule of rules)

        if (!lineHasMatch) {
          await this.UI.throwNoFilterMatchForLine(lines, config, this.handler.importOptions)
        }

      } // for (const line of lines)

      if (transfers.length > 0) {
        return await this.postProcess(segment, {
          type: 'transfers',
          transfers
        })
      }

    } catch (err) {

      if (err instanceof RuleParsingError) {
        await this.throwErrorRetry(err, config.language as Language)
      } else {
        throw err
      }
    }

    // Decide the error when passing through without finding an answer.
    if (matched) {
      throw new Error(`Found matches but the result list is empty for ${JSON.stringify(lines)}.`)
    }
    throw new Error(`Could not find rules matching ${JSON.stringify(lines)}.`)
  }

  /**
   * Check if there is an explicit answer already that needs to be returned for this segment.
   */
  private async checkExplicitResult(segment: ImportSegment, ans: unknown): Promise<TransactionDescription | undefined> {

    if (ans && segment.id) {

      const answers: Record<SegmentId, Record<string, unknown>> = ans as Record<SegmentId, Record<string, unknown>>

      if (answers[segment.id]) {
      // Explicit transfer.
        if (answers[segment.id].transfers) {
          return await this.postProcess(segment, {
            type: 'transfers',
            transfers: answers[segment.id].transfers as AssetTransfer[]
          })
        }
        // Explicit skipping.
        if (answers[segment.id].skip) {
          return {
            type: 'transfers',
            transfers: [],
            transactions: [
              {
                date: segment.time,
                segmentId: segment.id,
                entries: [],
                executionResult: 'skipped'
              }
            ]
          }
        }
      }
    }
  }

  /**
   * Compute results from a rule.
   */
  private parseResults(engine: RulesEngine, lines: TextFileLine[], rule: ImportRule, values: RuleVariables, answers: RuleVariables): AssetTransfer[] {

    const transfers: AssetTransfer[] = []
    const results: ImportRuleResult[] = 'length' in rule.result ? rule.result : [rule.result]

    let index = 0
    if (results.length === 0) {
      debug('RULES', 'Result: NONE')
    }
    for (const result of results) {
      debug('RULES', `Result[${index}]:`)
      const transfer: Partial<AssetTransfer> = {}
      // Collect fields evaluating directly from formula.
      for (const [name, formula] of Object.entries(result)) {
        if (name in transfer) {
          warning(`A rule '${rule.name}' resulted duplicate value in formula '${formula}' for the field '${name}''. Already having ${JSON.stringify(transfer)}.`)
        } else {
          transfer[name] = engine.eval(formula, { ...values, ...answers })
          debug('RULES', `  ${name} =`, JSON.stringify(transfer[name]))
        }
      }
      // Verify condition before adding.
      if (transfer.if === undefined || engine.eval(transfer.if, { ...values, ...answers })) {
        // Catch bad results from formulas. Hit two jokers as well.
        if (isAssetTransfer(transfer) && transfer.asset !== 'undefined' && transfer.asset !== 'null') {
          transfers.push(transfer as AssetTransfer)
          if (transfer.if) {
            debug('RULES', '  Accepted condition', transfer.if)
          }
        } else {
          console.log('Failing lines:')
          console.dir(lines, { depth: null })
          console.log('Matching rule:')
          console.dir(rule, { depth: null })
          throw new BadState(`Asset transfer ${JSON.stringify(transfer)} is incomplete.`)
        }
      } else {
        debug('RULES', '  Dropped due to condition', transfer.if)
      }
      index++
    }

    return transfers
  }

  /**
   * Throw UI error with retry option.
   */
  private async throwErrorRetry(err: RuleParsingError, lang: Language) {
    error(`Parsing error in expression '${err.expression}': ${err.message}`)
    if (err.variables.rule) {
      error(`While parsig rule ${JSON.stringify(err.variables.rule)}`)
    }
    if (err.variables && err.variables.text) {
      error(`Failure in line ${err.variables.lineNumber}: ${err.variables.text}`)

      const variables = clone(err.variables)
      delete variables.config
      delete variables.rule
      delete variables.text
      delete variables.lineNumber
      error(`Variables when processing the line: ${JSON.stringify(variables)}.`)
    }
    // For parsing errors we can expect user editing configuration and then retrying.
    const msg = (await this.UI.getTranslation('Parsing error in expression `{expr}`: {message}', lang)).replace('{expr}', err.expression).replace('{message}', err.message)
    await this.UI.throwErrorRetry(msg, lang)
  }

  /**
   * Check for needed adjustments like VAT before returning the result.
   * @param result
   * @returns
   */
  private async postProcess(segment: ImportSegment, result: TransactionDescription): Promise<TransactionDescription> {

    // Find currency.
    const vatReasons = new Set<AssetTransferReason>(['dividend', 'income', 'expense'])
    const currencies: Set<Currency> = new Set(result.transfers.filter(t => vatReasons.has(t.reason) && t.type === 'currency').map(t => t.asset as Currency))
    if (currencies.size > 1) {
      throw new SystemError(`Not yet able to sort out VAT for multiple different currencies in ${JSON.stringify(result.transfers)}`)
    }

    // If no currencies, assume no VAT.
    if (currencies.size) {

      const currency: Currency = [...currencies][0]

      // Add VAT where needed.
      const vatTransfers: AssetTransfer[] = []
      for (const transfer of result.transfers) {
        let vatPct
        if (transfer.data && 'vat' in transfer.data) {
          vatPct = transfer.data.vat
        } else {
          vatPct = await this.handler.getVAT(segment.time, transfer, currency)
        }
        const vatValue = (transfer.data && 'vatValue' in transfer.data) ? transfer.data.vatValue : null

        if ((vatPct || vatValue) && transfer.amount) {
          const oldAmount = Math.round(transfer.amount * 100)
          const newAmount = vatValue !== null && vatValue !== undefined ? Math.round(oldAmount - vatValue * 100) : Math.round(transfer.amount * 100 / (1 + vatPct / 100))
          transfer.amount = newAmount / 100
          const vat = oldAmount - newAmount
          const vatEntry: AssetTransfer = {
            reason: 'tax',
            type: 'statement',
            asset: vat > 0 ? 'VAT_FROM_PURCHASES' : 'VAT_FROM_SALES',
            amount: vat / 100,
            data: {
              currency
            }
          }

          if (transfer.tags) {
            vatEntry.tags = transfer.tags
          }

          vatTransfers.push(vatEntry)
        }
      }

      result.transfers = result.transfers.concat(vatTransfers)
    }

    // Bundle tags if given as an object.
    for (let i = 0; i < result.transfers.length; i++) {
      if ('tags' in result.transfers[i] && typeof result.transfers[i].tags === 'object' && result.transfers[i].tags?.length === undefined && result.transfers[i].tags !== null) {
        const tags: Record<string, unknown> = result.transfers[i].tags as unknown as Record<string, unknown>
        result.transfers[i].tags = Object.keys(tags).filter(t => !!tags[t]).sort() as Tag[]
      }
    }

    return result
  }
}
