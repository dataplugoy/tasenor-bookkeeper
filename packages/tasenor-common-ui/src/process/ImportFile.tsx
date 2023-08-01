import { ProcessConfig, TextFileLine, SegmentId } from '@tasenor/common'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { Accordion, AccordionDetails, AccordionSummary, IconButton, Link, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography, useTheme } from '@mui/material'
import React, { useState } from 'react'
import { ConfigView } from './ConfigView'
import { DefaultResultViewProps } from './DefaultResultView'

export type ImportLineProps = {
  config: ProcessConfig
  lineNumber: number
  columns: Record<string, string>
  text: string
  segmentId?: string
  color?: string
  result?: unknown
  resultView: (props: DefaultResultViewProps) => JSX.Element
}

/**
 * Renderer for single line of a text file.
 * @param props
 * @returns
 */
export const ImportLine = (props: ImportLineProps): JSX.Element => {
  const { segmentId, lineNumber, color, text, columns } = props
  const ResultView = props.resultView
  const hasColumns = Object.keys(columns).length > 0
  const [open, setOpen] = useState<boolean>(false)

  if (text.trim() === '') {
    return <></>
  }
  return (
    <>
      <TableRow onClick={() => setOpen(!open)}>
        <TableCell>{lineNumber}</TableCell>
        <TableCell style={{ backgroundColor: color }}></TableCell>
        <TableCell>
          <Typography sx={{ fontFamily: 'Monospace', overflow: 'hidden', textOverflow: 'hidden', fontSize: '80%' }}>{text}</Typography>
        </TableCell>
        <TableCell>
          { hasColumns && !open && <IconButton size="small" onClick={() => setOpen(true)}><ExpandMore/></IconButton> }
          { hasColumns && open && <IconButton size="small" onClick={() => setOpen(false)}><ExpandLess/></IconButton> }
        </TableCell>
      </TableRow>
      { open && hasColumns &&
        <TableRow>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell>
            { segmentId &&
              <Link href={`#segment-${segmentId}`}>
                <Typography style={{ color: 'white', backgroundColor: color }}>Segment ID: {segmentId}</Typography>
              </Link>
            }
            <ConfigView ignore={/^_/} config={columns}/>
          </TableCell>
          <TableCell></TableCell>
        </TableRow>
      }
      { props.result &&
        <TableRow>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell id={props.result ? `segment-${segmentId}` : undefined}>
            <ResultView config={props.config} result={props.result} />
          </TableCell>
          <TableCell></TableCell>
        </TableRow>
      }
    </>
  )
}

export type ImportFileProps = {
  config: ProcessConfig
  name: string
  lines: TextFileLine[]
  result?: Record<SegmentId, unknown>
  resultView: (props: DefaultResultViewProps) => JSX.Element
}

/**
 * Line by line display for imported file.
 * @param props
 * @returns
 */
export const ImportFile = (props: ImportFileProps): JSX.Element => {

  const [expanded, setExpanded] = React.useState(false)
  const { palette } = useTheme()
  const colors = [
    palette.primary.dark,
    palette.secondary.light,
    palette.primary.main,
    palette.secondary.dark,
    palette.primary.light,
    palette.secondary.main
  ]
  const segmentIds: Set<string> = new Set()
  const segementNumbers: Record<string, number> = {}

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)} TransitionProps={{ timeout: 50 }}>

      <AccordionSummary expandIcon={<ExpandMore />} id={`File ${props.name}`}>
        <Typography variant="subtitle1"><strong>{props.name}</strong></Typography>
      </AccordionSummary>

      <AccordionDetails>
        <TableContainer component={Paper} sx={{ width: '60vw' }}>
          <Table size="small">
            <TableBody>
              {props.lines.map((line, idx) => {
                let color: string | undefined
                // Establish segment color.
                if (line.segmentId) {
                  if (segementNumbers[line.segmentId] === undefined) {
                    segementNumbers[line.segmentId] = segmentIds.size
                    segmentIds.add(line.segmentId)
                  }
                  color = colors[segementNumbers[line.segmentId] % colors.length]
                }
                // Add result if last of the segment.
                const isLast = (idx === props.lines.length - 1) || line.segmentId !== props.lines[idx + 1].segmentId

                return <ImportLine
                  key={line.line}
                  config={props.config}
                  segmentId={line.segmentId}
                  result={isLast && line.segmentId && props.result ? props.result[line.segmentId] : undefined}
                  resultView={props.resultView}
                  lineNumber={line.line + 1}
                  columns={line.columns}
                  color={color}
                  text={line.text}
                />
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>

    </Accordion>
  )
}
