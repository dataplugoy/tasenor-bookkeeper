/**
 * Options for the CSV parsing.
 *
 * * `useFirstLineHeadings` - If set, the first line is first trimmed from space an # and then used as headings for columns.
 * * `cutFromBeginning` - Drop this many lines from the start.
 * * `columnSeparator` - A column seprator string. Defaults to `,`.
 * * `trimLines` - If set, trim white space from lines before using.
 * * `skipErrors` - If set, ignore lines with errors.
 */
export declare type ImportCSVOptions = {
  columnSeparator?: string
  cutFromBeginning?: number
  trimLines?: boolean
  useFirstLineHeadings?: boolean,
  skipErrors?: boolean
}
