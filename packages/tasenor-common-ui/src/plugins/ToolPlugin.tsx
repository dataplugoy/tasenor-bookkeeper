import { HttpMethod, Values } from '@tasenor/common'
import React from 'react'
import { UiPlugin } from './UiPlugin'

/**
 * Tool plugins implement one or more pages under the Tools main menu.
 */
export class ToolPlugin extends UiPlugin {

  /**
   * Return menu entries for Tools page.
   * @returns
   */
  toolMenu(): { title: string, disabled: boolean }[] {
    return []
  }

  /**
   * A text used to present this tool in the side menu.
   * Number is index of the menu entry if tool has more than one.
   * @param index
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toolTitle(index: number): string {
    return ''
  }

  /**
   * Construct a content for the top panel when this tool is selected.
   * Number is index of the menu entry if tool has more than one.
   * @param index
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toolTopPanel(index: number): JSX.Element {
    return <></>
  }

  /**
   * Construct actual content for the main area when this tool is selected.
   * Number is index of the menu entry if tool has more than one.
   * @param index
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toolMainPanel(index: number): JSX.Element {
    return <></>
  }

  /**
   * Executor for HTTP requests.
   */
  private async request(method: HttpMethod, params: undefined | Values = undefined) {
    const { db } = this.store
    return this.store.request(`/db/${db}/tools/${this.code}`, method, params || null)
  }

  /**
   * Make a GET request to the backend component of the plugin.
   */
  async GET(query: Values | undefined = undefined) {
    return this.request('GET', query)
  }

  /**
   * Make a DELETE request to the backend component of the plugin.
   */
  async DELETE(query: Values | undefined = undefined) {
    return this.request('DELETE', query)
  }

  /**
   * Make a POST request to the backend component of the plugin.
   */
  async POST(params: Values) {
    return this.request('POST', params)
  }

  /**
   * Make a POST request to the backend component of the plugin.
   */
  async PUT(params: Values) {
    return this.request('PUT', params)
  }

  /**
   * Make a POST request to the backend component of the plugin.
   */
  async PATCH(params: Values) {
    return this.request('PATCH', params)
  }
}
