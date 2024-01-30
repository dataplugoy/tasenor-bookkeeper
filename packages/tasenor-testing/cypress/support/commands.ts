/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />

import './commands/auth'
import './commands/assertions'
import './commands/elements'
import './commands/nav'
import './commands/plugins'

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      adminLogin(): Chainable<void>
      button(text: string): Chainable<JQuery<HTMLElement>>
      dialog(text: string): Chainable<JQuery<HTMLElement>>
      dropdown(text: string): Chainable<JQuery<HTMLElement>>
      errors(): Chainable<JQuery<HTMLElement>>
      form(fields: Record<string, string>): Chainable<void>
      goto(menu: string, listItem?: string, icon?: string): Chainable<void>
      icon(text: string): Chainable<JQuery<HTMLElement>>
      installPlugin(code: string): Chainable<void>
      list(text: string): Chainable<JQuery<HTMLElement>>
      login(email: string, password: string, admin?: boolean): Chainable<void>
      language(lang: string): Chainable<void>
      logout(): Chainable<void>
      menu(text: string): Chainable<JQuery<HTMLElement>>
      messages(): Chainable<JQuery<HTMLElement>>
      plugin(text: string): Chainable<JQuery<HTMLElement>>
      qaLogin(): Chainable<void>
      selection(dropdown: string, item: string): Chainable<void>
      subscribePlugin(code: string): Chainable<void>
      text(text: string): Chainable<JQuery<HTMLElement>>
      unsubscribePlugin(code: string): Chainable<void>
      userLogin(): Chainable<void>
      waitLoading(): Chainable<void>
    }
  }
}
