/**
 * ## Importing
 *
 * This module has types used in the importing data to the system using Interactive Stateful Process.
 *
 * ### Importing Process
 *
 * The import processing goes through the following stages:
 *
 * ```mermaid
 * flowchart LR
 *    START --> segmentation
 *    segmentation --> classification
 *    classification --> analyze
 *    analyze --> execution
 *    execution --> END
 * ```
 *
 * 1. **Segmentation**: Split incoming data to smaller pieces so that parts of the original data are grouped
 *    together under unique *segmentation ID*. Each group present some meaningful unit of information
 *    belonging together called *segment*.
 * 2. **Classification**: For each segment, determine which *class* it belongs to. Classes are some
 *    defined set of qualities describing similar segments.
 * 3. **Analyze**: Based on the classification, additional information can be collected and/or calculated
 *    for each segment.
 * 4. **Execution**: Once information for each segment is complete, we can execute database insertions,
 *    REST API calls or whatever appropriate actions based on the segement data.
 *
 * @module tasenor-common/src/import
 */
export * from './ImportConfig'
export * from './ImportAction'
export * from './ImportCSVOptions'
export * from './ImportState'
export * from './TextFileLine'
