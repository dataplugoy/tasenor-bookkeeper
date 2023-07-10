/**
 * Fixed universal value definitions.
 *
 * @module tasenor-common/src/constants
 */

/**
 * How many letters in symbol describing targets as its ID.
 */
export const MAX_TARGET_ID_LEN = 64

/**
 * Maximum request size for file uploads (1GB).
 */
export const MAX_UPLOAD_SIZE = 1 * 1024 * 1024 * 1024

/**
 * A number that is rounded to zero when calculating transaction monetary value.
 */
export const ZERO_CENTS = 1e-4

/**
 * A number that is rounded to zero when calculating amount of stock assets.
 */
export const ZERO_STOCK = 1e-6
