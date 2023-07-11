import { AccountElement, AccountAddress, FilterRule, Language, UIQuery, TasenorElement, Tag, AccountNumber, PluginCode, TransactionImportOptions, ButtonElement, MessageElement, ProcessConfig, TextFileLine, TextFileLineElement, AssetType, Asset, ImportSegment } from '@dataplug/tasenor-common'
import { AskUI, SystemError } from '../error'

/**
 * Injected dependecies for UI query generator.
 */
export interface TransactionUIDependencies {
  getAccountCanditates(addr: AccountAddress, config: ProcessConfig): Promise<AccountNumber[]>
  getTranslation(text: string, language: Language): Promise<string>
}

/**
 * A RISP generator creating UI definitions for various questions.
 */
export class TransactionUI {

  private deps: TransactionUIDependencies
  constructor(deps: TransactionUIDependencies) {
    this.deps = deps
  }

  /**
   * Ensure that variable is in the configuration. If not throw AskUI exception to ask it from the user.
   * @param config
   * @param variable
   */
  async getConfigOrAsk(config: ProcessConfig, variable: string, element: TasenorElement, allowNull: boolean = true): Promise<unknown> {
    if (variable in config && config[variable] !== null) {
      return config[variable]
    }
    throw new AskUI({
      type: 'flat',
      elements: [
        element,
        await this.submit('Continue', 1, config.language as Language)
      ]
    })
  }

  /**
   * Throw a query for boolean value if not in the configuration.
   * @param config
   * @param variable
   * @param description
   */
  async getBoolean(config: ProcessConfig, variable: string, description: string) {
    return this.getConfigOrAsk(config, variable, {
      type: 'yesno',
      name: `configure.${variable}`,
      label: await this.getTranslation(description, config.language as Language),
      actions: {}
    })
  }

  /**
   * Check if we have an answer for a segment.
   */
  async getSegmentAnswer(config: ProcessConfig, segment: ImportSegment, variable: string): Promise<unknown | undefined> {
    if ('answers' in config) {
      const answers: Record<string, Record<string, unknown>> = config.answers as Record<string, Record<string, unknown>>

      const segmentAnswers = answers[segment.id]
      if (segmentAnswers && variable in segmentAnswers) {
        return segmentAnswers[variable]
      }
    }

    return undefined
  }

  /**
   * Get the cash account for quick import selections.
   */
  async getCashAccount(config: ProcessConfig): Promise<AccountNumber> {
    return await this.getConfigOrAsk(config, 'cashAccount', {
      type: 'account',
      filter: { type: 'ASSET' },
      name: 'configure.cashAccount',
      label: await this.getTranslation('Select contra account for imported transactions, i.e. cash account.', config.language as Language),
      actions: {}
    }, false) as AccountNumber
  }

  /**
   * Check if the question about asset renaming is answered. If not, throw a question.
   */
  async askedRenamingOrThrow(config: ProcessConfig, segment: ImportSegment, type: AssetType, asset: Asset): Promise<boolean> {
    const ans = await this.getSegmentAnswer(config, segment, `hasBeenRenamed.${type}.${asset}`) as undefined | boolean

    if (ans === undefined) {
      throw new AskUI(await this.message(`Asset renaming question not implemented (avoid error for now by setting answer 'hasBeenRenamed.${type}.${asset}' for segment '${segment.id}').`, 'error'))
    }
    return ans
  }

  /**
   * Get the translation for the text to the currently configured language.
   * @param text
   * @returns
   */
  async getTranslation(text: string, language: Language): Promise<string> {
    return this.deps.getTranslation(text, language)
  }

  /**
   * Construct a translated label for an account dropdown.
   * @param accType
   * @returns
   */
  async accountLabel(accType: AccountAddress, language: Language): Promise<string> {
    const [reason, type, asset] = accType.split('.')
    const text = await this.getTranslation(`account-${reason}-${type}`, language)

    // Resolve name for the asset.
    let name = asset
    if (type === 'statement') {
      if (reason === 'income') {
        name = await this.getTranslation(`income-${asset}`, language)
      } else if (reason === 'expense') {
        name = await this.getTranslation(`expense-${asset}`, language)
      } else if (reason === 'tax') {
        name = await this.getTranslation(`tax-${asset}`, language)
      }
    }

    return text.replace('{asset}', name)
  }

  /**
   * Construct a filter for account family.
   * @param config
   * @param accType
   * @returns
   */
  accountFilter(accType: AccountAddress): FilterRule {
    const [reason] = accType.split('.')
    switch (`${reason}`) {
      case 'debt':
        return { type: ['ASSET', 'LIABILITY'] }
      case 'deposit':
      case 'trade':
      case 'withdrawal':
        return { type: 'ASSET' }
      case 'fee':
        return { type: 'EXPENSE' }
    }
    // TODO: Think about the rest combinations. Needs probably account subtypes.
    return null
  }

  /**
   * Construct a query for an account by its address.
   * @param missing
   */
  async account(config: ProcessConfig, account: AccountAddress, defaultAccount: AccountNumber | undefined = undefined): Promise<AccountElement> {
    const language: Language = config.language as Language

    const ui: AccountElement = {
      type: 'account',
      name: `configure.account.${account}`,
      actions: {},
      label: await this.accountLabel(account, language),
      filter: this.accountFilter(account)
    }

    if (defaultAccount) {
      ui.defaultValue = defaultAccount
    } else {
      const canditates = await this.deps.getAccountCanditates(account, { ...config, plugin: config.handlers instanceof Array && config.handlers.length ? config.handlers[0] as PluginCode : undefined })
      if (canditates.length) {
        ui.defaultValue = canditates[0]
        if (canditates.length > 1) {
          ui.preferred = canditates
        }
      }
    }

    return ui
  }

  /**
   * Interrupt with a query asking an account.
   * @param account
   * @param language
   */
  async throwGetAccount(config: ProcessConfig, address: AccountAddress): Promise<never> {
    const account = await this.account(config, address)
    const submit = await this.submit('Continue', 1, config.language as Language)
    throw new AskUI({
      type: 'flat',
      elements: [
        account as unknown as TasenorElement,
        submit
      ]
    })
  }

  /**
   * Ask for account to be used for negatice balance instead of the account itself.
   * @param address
   * @param language
   */
  async throwDebtAccount(config: ProcessConfig, account: AccountNumber, address: AccountAddress): Promise<never> {
    const language: Language = config.language as Language
    const text = await this.getTranslation('The account below has negative balance. If you want to record it to the separate debt account, please select another account below.', language)
    const message = await this.message(text, 'info')
    const parts = address.split('.')
    const debtAddr = `debt.${parts[1]}.${parts[2]}` as AccountAddress
    const accountUI = await this.account(config, debtAddr, account)
    const submit = await this.submit('Continue', 1, language)
    throw new AskUI({
      type: 'flat',
      elements: [
        message,
        accountUI as unknown as TasenorElement,
        submit
      ]
    })
  }

  /**
   * Construct a query for asking about grouping of accounts and account number for group if selected.
   * @param accounts
   * @param language
   * @returns
   */
  async accountGroup(config: ProcessConfig, accounts: AccountAddress[]): Promise<TasenorElement> {
    const [reason, type] = accounts[0].split('.')
    const elements: AccountElement[] = []
    const language: Language = config.language as Language

    for (const account of accounts) {
      elements.push(await this.account(config, account))
    }

    return {
      type: 'flat',
      elements: [
        {
          type: 'boolean',
          name: `grouping.${reason}.${type}`,
          label: await this.getTranslation('Do you want to use the same account for all of them?', language),
          defaultValue: false,
          actions: {}
        },
        {
          type: 'case',
          condition: `grouping.${reason}.${type}`,
          cases: {
            true: await this.account(config, `${reason}.${type}.*` as AccountAddress),
            false: {
              type: 'flat',
              elements
            }
          }
        }
      ]
    }
  }

  /**
   * Submit button for UI configuration.
   * @param language
   * @returns
   */
  async submit(label: string, objectWrapLevel: number, language: Language): Promise<ButtonElement> {
    let errorMessage = await this.getTranslation('Saving failed', language)
    let successMessage = await this.getTranslation('Saved successfully', language)
    if (label === 'Retry') {
      errorMessage = await this.getTranslation('Retry failed', language)
      successMessage = await this.getTranslation('Retried successfully', language)
    }
    return {
      type: 'button',
      label,
      actions: {
        onClick: {
          type: 'post',
          url: '',
          objectWrapLevel,
          errorMessage,
          successMessage
        }
      }
    }
  }

  /**
   * A UI message.
   * @param message
   */
  async message(text: string, severity: 'info' | 'warning' | 'error' | 'success'): Promise<MessageElement> {
    return {
      type: 'message',
      severity,
      text
    }
  }

  /**
   * Throw an error message with Retry button.
   * @param message
   */
  async throwErrorRetry(message: string, language: Language) {
    throw new AskUI({
      type: 'flat',
      elements: [
        await this.message(message, 'error'),
        await this.submit('Retry', 0, language)
      ]
    })
  }

  /**
   * Construct RISP element from UI query.
   *
   * The following questions can be expressed:
   *
   * ### Choose an Option
   *
   * A list of fixed options are given. The display text is a key and the value is the resulting value, if selected.
   * ```json
   * {
   *   "name": "Option Question",
   *   "label": "Choose one of the following:",
   *   "ask": {
   *     "Hardware equipment": "HARDWARE",
   *     "Software": "SOFTWARE"
   *   }
   * }
   * ```
   *
   * ### Choose a Tag
   *
   * An ability to select from predetermined set of tags we can use
   * ```json
   * {
   *   "name": "Tag Selection",
   *   "label": "Select a tag:",
   *   "chooseTag": [ "A", "B", "C" ]
   * }
   * ```
   *
   * ### Explain in Text
   * A simple text box can be used with
   * ```json
   * {
   *   "name": "A Text Box",
   *   "label": "Plase enter the purchase description:",
   *   "text": true
   * }
   * ```
   *
   * @param query
   */
  async parseQuery(name: string, query: UIQuery, language: Language): Promise<TasenorElement> {
    if ('ask' in query) {
      // This is just object mapping explanation to values.
      return {
        name,
        type: 'radio',
        label: query.label || await this.getTranslation('Select one of the following:', language),
        actions: {},
        options: query.ask as Record<string, string>
      }
    } else if ('chooseTag' in query) {
      return {
        name,
        type: 'tags',
        label: query.label || await this.getTranslation('Select one of the following:', language),
        actions: {},
        single: true,
        options: query.chooseTag as Tag[]
      }
    } else if ('text' in query) {
      return {
        name,
        type: 'text',
        label: query.label || await this.getTranslation('Please enter text:', language),
        actions: {}
      }
    } else {
      throw new SystemError(`Unable to parse UI from query ${JSON.stringify(query)}.`)
    }
  }

  /**
   * Construct UI for general query.
   * @param UIQuery
   * @param language
   */
  async query(name: string, query: UIQuery | UIQuery[], lines: TextFileLine[] | null, language: Language): Promise<TasenorElement> {
    const elements: TasenorElement[] = []

    // Construct some reference if we know context.
    if (lines && lines.length) {
      elements.push(await this.describeLines(lines, language))
    }

    if (query instanceof Array) {
      for (const q of query) {
        elements.push(await this.parseQuery(name, q, language))
      }
    } else {
      elements.push(await this.parseQuery(name, query, language))
    }
    elements.push(await this.submit('Continue', 2, language))

    return {
      type: 'flat',
      elements
    }
  }

  /**
   * Construct a query and throw it immediately.
   * @param name
   * @param query
   * @param lines
   * @param language
   */
  async throwQuery(name: string, query: UIQuery | UIQuery[], lines: TextFileLine[] | null, language: Language): Promise<never> {
    const element = await this.query(name, query, lines, language)
    this.throw(element)
  }

  /**
   * Throw UI exception in order to collect more information from UI.
   * @param element
   */
  throw(element: TasenorElement): never {
    throw new AskUI(element as TasenorElement)
  }

  /**
   * Construct a descriptor of context lines needed to display in a question.
   * @param lines
   * @param language
   * @returns
   */
  async describeLines(lines: TextFileLine[], language: Language): Promise<TasenorElement> {
    const viewer: TextFileLineElement[] = lines.map(line => ({
      type: 'textFileLine',
      line
    }))
    return {
      type: 'box',
      elements: [
        {
          type: 'html',
          html: `<strong>${await this.getTranslation('Based on the following imported lines', language)}</strong>`
        },
        ...viewer
      ]
    }
  }

  /**
   * Construct a query asking one of the options in order to store to the configuration.
   * @param text
   * @param variable
   * @param options
   */
  async throwRadioQuestion(text, variable, options, language: Language): Promise<never> {
    throw new AskUI({
      type: 'flat',
      elements: [
        {
          type: 'message',
          severity: 'info',
          text
        },
        {
          type: 'radio',
          name: `configure.${variable}`,
          options,
          actions: {}
        },
        {
          type: 'button',
          label: await this.deps.getTranslation('Continue', language),
          actions: {
            onClick: {
              type: 'post',
              url: '',
              objectWrapLevel: 1
            }
          }
        }
      ]
    })
  }

  /**
   * Pass control to the rule editor when found a line not matching a filter.
   * @param lines
   * @param language
   */
  async throwNoFilterMatchForLine(lines: TextFileLine[], config: ProcessConfig, options: TransactionImportOptions): Promise<never> {
    const cashAccount = await this.getCashAccount(config)
    throw new AskUI({
      type: 'ruleEditor',
      name: 'once',
      actions: {
        onContinue: {
          type: 'post',
          url: ''
        },
        onCreateRule: {
          type: 'post',
          url: '/rule'
        }
      },
      config,
      lines,
      options,
      cashAccount
    })
  }
}
