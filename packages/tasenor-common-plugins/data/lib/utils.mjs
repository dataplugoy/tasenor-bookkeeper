import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
// TODO: This should be imported from tasenor-common but it does not work yet.
const MAX_TARGET_ID_LEN = 64

const DIRNAME = path.join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * Read in text from UTF-8 encoded file.
 * @param fileName
 */
export function readFile(fileName) {
  const file = path.join(DIRNAME, 'data', 'src', fileName)
  const text = fs.readFileSync(file).toString('utf-8')
  return text
}

/**
 * Read TSV file so that first line defines names for columns, which are used in the mapping.
 * @param file
 * @returns
 */
export function readTsv(fileName, raw = false) {
  const data = readFile(fileName).split('\n').map(s => s.trim()).filter(s => !!s).map(s => s.split('\t'))
  if (raw) {
    return data
  }
  const headers = data[0]
  headers[0] = headers[0].replace(/^#\s*/, '')
  const results = []
  for (let i = 1; i < data.length; i++) {
    const item = {}
    for (let j = 0; j < headers.length; j++) {
      item[headers[j]] = data[i][j]
    }
    results.push(item)
  }
  return results
}

/**
 * Go through data entries and add `level` and `parent` fields. Remove _ prefixes from idField.
 * @param data
 * @param idField
 */
export function collectParents(data, idField) {
  const parents = {
    '-1': null,
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null
  }
  for (const line of data) {
    const match = /^(_*)/.exec(line[idField])
    line.level = match[1].length
    line[idField] = line[idField].replace(/^_+/, '')
    line.parent = parents[line.level - 1]
    if (line.level && !line.parent) {
      throw new Error(`Something wrong with ${JSON.stringify(line)}. Cannot find parent level for it.`)
    }
    parents[line.level] = line[idField]
  }
  return data
}

/**
 * Collect language codes from header line.
 * @param data
 */
export function languages(data) {
  return Object.keys(data[0]).slice(1).filter(k => /^[a-z][a-z]$/.test(k))
}

/**
 * Construct a language translation table.
 * @param data
 * @param prefix
 * @param translations
 */
export function makeTranslations(data, prefix, translations) {
  const tr = {}
  for (const lang of translations) {
    tr[lang] = data.reduce((prev, cur) => ({ ...prev, [`${prefix}-${cur.id}`]: cur[lang] }), {})
  }
  return tr
}

/**
 * Drop first and last bracket and add indentation to every line.
 * @param output
 */
export function trimIndentation(output, indent = '') {
  let text = JSON.stringify(output, null, 2)
  text = text.substr(2, text.length - 4)
  text = text.split('\n').map(line => indent + line.replace(/^ {2}/, ''))
  return '\n' + text.join('\n') + '\n'
}

/**
 * Load and pre-process a TSV file.
 * @param fileName
 */
export function parseFile(fileName) {
  const tsv = readTsv(fileName)
  const data = collectParents(tsv, 'id')
  return data
}

/**
 * Refresh plugin translation data.
 * @param prefix
 * @param fileName
 */
export function rebuildTranslations(plugin, prefix, fileName) {
  const data = parseFile(fileName)
  const translations = languages(data)
  const output = makeTranslations(data, prefix, translations)
  return output
}

/**
 * Put together multiple translations and sort them all.
 * @param files
 * @returns
 */
export function combine(...files) {
  const all = {}
  const languages = new Set()
  for (const file of files) {
    Object.entries(file).forEach(([lang, data]) => {
      all[lang] = all[lang] || {}
      languages.add(lang)
      Object.assign(all[lang], data)
    })
  }

  const sorted = {}
  for (const lang of languages) {
    sorted[lang] = {}
    const keys = Object.keys(all[lang]).sort()
    for (const k of keys) {
      sorted[lang][k] = all[lang][k]
    }
  }

  return sorted
}

/**
 * Do rude lint fixing for JSON string.
 * @param text
 */
export function lint(text) {
  return text.replace(/"/g, "'").replace(/'(\w+)':/g, '$1:')
}

/**
 * Insert text between the given separators in a file.
 * @param pathParts
 * @param text
 * @param startSep
 * @param endSep
 */
export function insertToFile(pathParts, text, startSep, endSep) {
  const filePath = path.join(DIRNAME, 'src', ...pathParts)
  const current = fs.readFileSync(filePath).toString('utf-8').split(startSep)
  if (current.length !== 2) {
    throw new Error(`Insertion to ${filePath} failed: start separator ${JSON.stringify(startSep)} not correct.`)
  }
  const tail = current[1].split(endSep)
  if (tail.length !== 2) {
    throw new Error(`Insertion to ${filePath} failed: end separator ${JSON.stringify(endSep)} not correct.`)
  }
  const combined = current[0] + startSep + text + endSep + tail[1]
  fs.writeFileSync(filePath, combined)
  console.log(new Date(), `Refreshed translation data in ${filePath}`)
}

/**
 * Construct actual data to store as a knowledge.
 */
export function buildData(data) {
  const result = {
    root: null,
    children: {},
    parents: {}
  }
  for (let i = 0; i < data.length; i++) {
    const { id, parent } = data[i]
    if (id.length > MAX_TARGET_ID_LEN) {
      throw new Error(`An ID '${id}' is too long (max. ${MAX_TARGET_ID_LEN}).`)
    }
    result.parents[id] = parent
    if (!parent) {
      if (result.root !== null) {
        throw new Error(`Found second root element ${JSON.stringify(data[i])}.`)
      }
      result.root = id
      continue
    }
    result.children[parent] = result.children[parent] || []
    result.children[parent].push(id)
  }
  return result
}

/**
 * Save JSON data to the plugin directory.
 * @param name
 * @param data
 */
export function saveJson(plugin, name, data) {
  const filePath = path.join(DIRNAME, 'src', plugin, 'backend', `${name}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')
  console.log(new Date(), `Saved JSON data to ${filePath}`)
}

/**
 * Save text file as it is to the plugin directory.
 * @param name
 * @param data
 */
export function saveText(plugin, name, text) {
  const filePath = path.join(DIRNAME, 'src', plugin, 'backend', name)
  fs.writeFileSync(filePath, text)
  console.log(new Date(), `Saved text data to ${filePath}`)
}

/**
 * Save text data to the file.
 * @param plugin
 * @param filePath
 * @param text
 */
export function saveFile(plugin, filePath, text) {
  let targetPath
  if (plugin[0] === '@') {
    const project = plugin.substr(1)
    if (!fs.existsSync(path.join(DIRNAME, '..', project))) {
      throw new Error(`Cannot find other project ${project} to write file.`)
    }
    targetPath = path.join(DIRNAME, '..', plugin.substr(1), filePath)
  } else {
    targetPath = path.join(DIRNAME, 'src', plugin, filePath)
  }
  fs.writeFileSync(targetPath, text)
  console.log(new Date(), `Saved data to ${targetPath}`)
}

/**
 * Remove _ prefixes from ID field.
 * @param data
 */
export function trimId(value) {
  return value.replace(/^_+/, '')
}

/**
 * Remove _ prefixes from ID fields from each line.
 * @param data
 */
export function trimIds(data, idField = 'id') {
  return data.map(line => ({ ...line, [idField]: trimId(line.id)}))
}

/**
 * Strip extras away and convert numeric string to proper number.
 * @param data
 */
 export function fixNumber(data) {
  return parseFloat(data.replace(/[^0-9.]/g, ''))
}

/**
 * Strip extras away and convert numeric string to proper number.
 * @param data
 * @param fieldName
 */
export function fixNumbers(data, fieldName) {
  return data.map(line => ({ ...line, [fieldName]: fixNumber(line[fieldName]) }))
}

/**
 * Gather two values from data to form a mapping from one field value to another.
 * @param data
 * @param keyName
 * @param valueName
 */
export function toMap(data, keyName, valueName) {
  return data.reduce((prev, cur) => ({ ...prev, [cur[keyName]]: cur[valueName] }), {})
}

/**
 * Replace CRLF with LF.
 * @param text
 */
export function trimCRLF(text) {
  return text.replace(/\r\n/g, '\n')
}

/**
 * Remove duplicated flags from report as TSV data.
 */
export function cleanFlagDuplicates(tsv) {
  const rempoveDuplicates = (s) => {
    return [...new Set(s.split(' '))].join(' ').trim()
  }
  return tsv.split("\n").map(line => line.split("\t")).map(([a, b, c]) => [a, b, rempoveDuplicates(c)]).map(a => a.join("\t")).join("\n")
}
