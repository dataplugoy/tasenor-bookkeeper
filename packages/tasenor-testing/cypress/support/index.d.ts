/// <reference types="cypress" />

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      accountSelector(text: string): Chainable<JQuery<HTMLElement>>
      adminLogin(): Chainable<void>
      balance(account: string): Chainable<number>
      box(text: string): Chainable<JQuery<HTMLElement>>
      button(text: string): Chainable<JQuery<HTMLElement>>
      dialog(text: string): Chainable<JQuery<HTMLElement>>
      dropdown(text: string): Chainable<JQuery<HTMLElement>>
      errors(): Chainable<JQuery<HTMLElement>>
      fill2PartIncomeTx(date: string, text: string, amount: string, account: string): Chainable<void>
      fill3PartExpenseTx(date: string, text: string, amount: string, account: string): Chainable<void>
      fill3PartIncomeTx(date: string, text: string, amount: string, account: string): Chainable<void>
      form(fields: Record<string, string>): Chainable<void>
      goto(menu: string, listItem?: string, icon?: string): Chainable<void>
      icon(text: string): Chainable<JQuery<HTMLElement>>
      installPlugin(code: string): Chainable<void>
      language(lang: string): Chainable<void>
      list(text: string): Chainable<JQuery<HTMLElement>>
      login(email: string, password: string, admin?: boolean): Chainable<void>
      logout(): Chainable<void>
      menu(text: string): Chainable<JQuery<HTMLElement>>
      messages(): Chainable<JQuery<HTMLElement>>
      page(text: string): Chainable<JQuery<HTMLElement>>
      plugin(text: string): Chainable<JQuery<HTMLElement>>
      qaLogin(): Chainable<void>
      report(): Chainable<string[][]>
      selectBalance(account: string): Chainable<void>
      selectDb(name: string): Chainable<void>
      selection(dropdown: string, item: string): Chainable<void>
      subscribePlugin(code: string): Chainable<void>
      text(text: string): Chainable<JQuery<HTMLElement>>
      unsubscribePlugin(code: string): Chainable<void>
      userLogin(): Chainable<void>
      waitLoading(): Chainable<void>
    }
  }

  namespace Cypress {
    interface Chainer<Subject> {
      (chainer: 'cellEquals', row: number, col: number, text: string): Chainable<Subject>,
      (chainer: 'matchReport', heading1: string, heading2: string, report: string): Chainable<Subject>,
    }
  }
}
