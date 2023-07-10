import React from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton as MuiIconButton } from '@mui/material'
import { HelpOutline, AccountBalance, StarRate, AttachMoney, CreditCard, LocalGroceryStore, AddShoppingCart, PersonAdd, Print, CloudDownload, FormatIndentDecrease, Filter2, Filter3, Filter1, Filter4, LocalOffer, Lock, LockOpen, AttachFile, Functions, Event, Sort, Delete, Storage, CloudUpload, ZoomIn, ZoomOut, Visibility, VisibilityOff, PlaylistAdd, DeleteSweep, Build, Extension, Refresh, Add, AddCircleOutline, Settings, ShowChartTwoTone, Pageview, ExpandMore, ExpandLess, CloudUploadTwoTone, CloudDownloadTwoTone } from '@mui/icons-material'
import { haveCursor, Cursor } from '@dataplug/tasenor-common'

const ICONS = {
  'add-entry': PlaylistAdd,
  'add-tx': Add,
  'calendar-plus': Event,
  'credit-card': CreditCard,
  'delete-entry': DeleteSweep,
  'delete-tx': Delete,
  'hide-all': VisibilityOff,
  'shopping-cart': LocalGroceryStore,
  'show-all': Visibility,
  'sort-up': Sort,
  'user-plus': PersonAdd,
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
  build: Build,
  compact: FormatIndentDecrease,
  database: Storage,
  download: CloudDownload,
  less: ExpandLess,
  lock: Lock,
  load: CloudDownloadTwoTone,
  money: AttachMoney,
  more: ExpandMore,
  new: AddCircleOutline,
  paperclip: AttachFile,
  plugin: Extension,
  print: Print,
  profit: ShowChartTwoTone,
  quarter1: Filter1,
  quarter2: Filter2,
  quarter3: Filter3,
  quarter4: Filter4,
  refresh: Refresh,
  save: CloudUploadTwoTone,
  sales: AddShoppingCart,
  savings: AccountBalance,
  settings: Settings,
  star: StarRate,
  summarize: Functions,
  tag: LocalOffer,
  trash: Delete,
  unknown: HelpOutline,
  unlock: LockOpen,
  upload: CloudUpload,
  view: Pageview
}

export interface IconButtonProps {
  onClick: (e: MouseEvent) => void
  id: string
  icon: string
  title: string
  shortcut?: string
  toggle?: boolean
  pressKey?: string
  disabled?: boolean
}

export const IconButton = (props: IconButtonProps) => {

  const cursor: Cursor = haveCursor()
  const { t } = useTranslation()
  const { disabled, title, pressKey, onClick, icon, shortcut, toggle, id } = props
  let color: 'inherit' | 'secondary' | 'default' | 'primary' | 'error' | 'info' | 'success' | 'warning' | undefined = 'primary'
  let className = 'IconButton'
  if (toggle !== undefined) {
    color = toggle ? 'secondary' : undefined
    className += toggle ? ' toggle-on' : 'toggle-off'
  }
  const Icon = icon in ICONS ? ICONS[icon] : ICONS.unknown
  const handleClick = (e) => {
    if (!disabled) {
      if (pressKey) {
        cursor.handle(pressKey)
      }
      if (onClick) {
        onClick(e)
      }
    }
  }

  return (
    <MuiIconButton id={id} className={className} color={color} title={t('icon-' + title) + (shortcut ? ` (Ctrl + ${shortcut})` : '')} disabled={disabled} onClick={(e) => handleClick(e)}>
      <Icon style={{ fontSize: 30 }}/>
    </MuiIconButton>
  )
}
