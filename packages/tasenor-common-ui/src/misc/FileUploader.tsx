import React, { useState } from 'react'
import axios, { AxiosResponse } from 'axios'
import { encode } from 'base64-arraybuffer'
import { Button } from '@mui/material'
import { Trans } from 'react-i18next'
import { UploadFile } from '@mui/icons-material'

/**
 * Format of the returned file data from the file uploader component.
 */
export type FileUploadData = {
  name: string,
  type: string,
  encoding: string,
  data: string
}

/**
 * Props for the fileuploader.
 */
export type FileUploaderProps = {
  onUpload?: (files: FileUploadData[]) => void,
  uploadUrl?: string,
  onSuccess?: (resp: AxiosResponse) => void,
  onError?: (err: Error) => void,
  multiple?: boolean,
  color?: 'inherit' | 'error' | 'success' | 'primary' | 'secondary' | 'info' | 'warning',
  variant?: 'text' | 'outlined' | 'contained',
  disabled?: boolean
  text?: string
  icon?: JSX.Element | ''
  iconSize?: number
}

/**
 * An file uploader utility.
 * @param props.onUpload A function handling the resulting file upload data.
 */
export const FileUploader = (props: FileUploaderProps): JSX.Element => {

  const [uploading, setUploading] = useState(false)

  let uploads: FileUploadData[] = []

  /**
   * Helper to read a selected file in.
   * @param file
   * @returns
   */
  const readFileFromInput = async (file: File): Promise<ArrayBuffer> => {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = function () { resolve(reader.result as ArrayBuffer) }
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Helper to post process selected files.
   * @param binary
   * @param file
   */
  const collectUploadedFile = (binary: ArrayBuffer, file: File): void => {
    uploads.push({
      name: file.name,
      type: file.type,
      encoding: 'base64',
      data: encode(binary)
    })
  }

  /**
   * Upload handler.
   */
  const onUpload = async () => {
    if (props.onUpload) {
      props.onUpload(uploads)
    } else {
      if (!props.uploadUrl) {
        throw new Error('Upload URL is compulsory if no onUpload() callback defined.')
      }
      setUploading(true)
      await axios.post(props.uploadUrl, { files: uploads }).then(resp => {
        setUploading(false)
        props.onSuccess && props.onSuccess(resp)
      }).catch(err => {
        setUploading(false)
        if (props.onError) {
          props.onError(err)
        } else {
          console.error(err)
        }
      })
    }
  }

  /**
   * Handler of the file selection event for the file input component.
   * @param event
   */
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    uploads = []
    if (event.target.files) {
      for (const file of Array.from(event.target.files)) {
        const binary = await readFileFromInput(file as File).catch(function (reason) {
          console.log(`Error during upload ${reason}`)
          return null
        })
        if (binary) {
          collectUploadedFile(binary, file as File)
        }
        event.target.value = ''
      }
    }
    onUpload()
  }

  const noIcon = props.icon !== undefined && !props.icon
  const noText = props.text !== undefined && !props.text
  const text = props.text || <Trans>Upload</Trans>
  const iconSx = props.iconSize ? { width: props.iconSize, height: props.iconSize } : {}
  const icon = noIcon ? undefined : (props.icon || <UploadFile sx={iconSx}/>)

  return (
    <>
      <input id="file-uploader-input" disabled={!!props.disabled} type="file" multiple={!!props.multiple} hidden onChange={(e) => onFileChange(e)}/>
      <label htmlFor="file-uploader-input">
        { noText &&
          <Button component="span" disabled={uploading || !!props.disabled} color={props.color}>{icon}</Button>
        }
        { !noText &&
          <Button component="span" disabled={uploading || !!props.disabled} startIcon={icon} color={props.color} variant={props.variant} >
            {text}
          </Button>
        }
      </label>
    </>
  )
}
