/**
 * Name of a file.
 */
export type FileName = string

/**
 * A line number in file running form 0 to n-1.
 */
export type LineNumber = number

/**
  * A importer specifc construct of unique segment identifier used in file data segmentation.
  */
export type SegmentId = string

/**
 * A constant denoting that something does not have segment ID.
 */
export const NO_SEGMENT = Symbol('NO_SEGMENT')

/**
  * One line in a text file data on the import process.
  *
  * Contains line numbering starting from 0 and the text content of the line.
  */
export type TextFileLine = {
  line: LineNumber,
  text: string,
  columns: Record<string, string>
  segmentId?: SegmentId,
}

/**
 * A segmentation information.
 */
export interface ImportSegment {
  id: SegmentId,
  time: Date,
  lines: { number: LineNumber, file: string }[]
}
