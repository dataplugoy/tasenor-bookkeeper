/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />

import './commands/auth'
import './commands/elements'
import './commands/nav'
import './commands/plugins'

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      adminLogin(): Chainable<void>
      button(text: string): Chainable<JQuery<HTMLElement>>
      errors(): Chainable<JQuery<HTMLElement>>
      form(fields: Record<string, string>): Chainable<void>
      goto(menu: string, listItem: string, icon?: string): Chainable<void>
      icon(text: string): Chainable<JQuery<HTMLElement>>
      installPlugin(code: string): Chainable<void>
      list(text: string): Chainable<JQuery<HTMLElement>>
      login(email: string, password: string, admin?: boolean): Chainable<void>
      logout(): Chainable<void>
      menu(text: string): Chainable<JQuery<HTMLElement>>
      messages(): Chainable<JQuery<HTMLElement>>
      plugin(text: string): Chainable<JQuery<HTMLElement>>
      text(text: string): Chainable<JQuery<HTMLElement>>
    }
  }
}
