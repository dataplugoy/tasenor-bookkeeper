import { Values } from '../types'
import { TasenorElement } from './elements'
import { TasenorSetup } from './setup'

/**
 * A parameter collection used when rendering element.
 *
 * @property element Actual top level element to render.
 * @property values A set of values to edit associated with the rendering process.
 * @property setup Global configuration for the rendering system.
 */
export type RenderingProps<ElementType = TasenorElement> = {
  element: ElementType,
  values: Values,
  setup: TasenorSetup
}
