import Opaque from "ts-opaque"

/**
 * An additional label that can be added to transaction entry.
 */
export type Tag = Opaque<string, 'Tag'>
export function isTag(s: unknown): s is Tag {
  return typeof s === 'string' && /^[A-Za-z0-9]+$/.test(s)
}

/**
 * A labels collected to the string in the format "[Tag1][Tag2][Tag3]".
 */
export type TagString = Opaque<string, 'TagString'>
export function isTagString(s: unknown): s is Tag {
  if (typeof s !== 'string' || !/^\[\]$/.test(s)) {
    return false
  }
  const tags = s.substr(1, s.length - 2).split('][')
  return tags.filter(tag => !isTag(tag)).length > 0
}

/**
 * Classification of a tag.
 */
export type TagType = Opaque<string, 'TagType'>
export function isTagType(s: unknown): s is TagType {
  return typeof s === 'string'
}

/**
 * Collect tags from the beginning of the string.
 */
export function extractTags(desc: string): [Tag[], string] {
  const tags: Tag[] = []
  while (true) {
    const match = /^\[([A-Za-z0-9]+)\]/.exec(desc)
    if (match) {
      tags.push(match[1] as Tag)
      desc = desc.substring(match[0].length)
    } else {
      break
    }
  }
  return [tags, desc.trim()]
}

/**
 * Merge tags to the string possibly having tags.
 */
export function mergeTags(desc: string, tags: string | Tag[]): string {
  const [oldTags, oldDesc] = extractTags(desc)
  if (typeof tags === 'string') {
    const [tags2] = extractTags(tags)
    tags = tags2
  }
  const newTags = [...new Set<Tag>(tags.concat(oldTags))].sort()
  if (newTags.length) {
    return `[${newTags.join('][')}] ${oldDesc}`.trim()
  }
  return oldDesc
}
