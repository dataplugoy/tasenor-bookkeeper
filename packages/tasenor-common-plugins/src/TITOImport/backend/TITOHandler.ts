import { NO_SEGMENT, SegmentId, TextFileLine } from '@dataplug/tasenor-common'
import { InvalidFile, NotImplemented, ProcessFile, TransactionImportHandler } from '@dataplug/tasenor-common-node'

// Store the latest transactoin ID
let ref: string | undefined

/**
 * Import implementation for TITO format.
 *
 * Based on https://www.nordea.fi/Images/146-84478/xml_tiliote.pdf
 */
export class TITOHandler extends TransactionImportHandler {

  constructor() {
    super('TITOImport')

    this.importOptions = {
      parser: 'custom',
      numericFields: ['Tapahtuman rahamäärä', 'Tietuetunnus', 'Panot Summa', 'Otot Summa', 'Panot Kappalemäärä', 'Otot Kappalemäärä', 'Tiliotteen tietueiden lukumäärä', 'Tilin limiitti'],
      requiredFields: ['Tietuetunnus', 'Viite', 'Seliteteksti'],
      insignificantFields: ['Tietuetunnus', 'Tapahtuman numero', 'Tapahtumatunnus', 'Koodi', 'Kuittikoodi', 'Välitystapa', 'Nimen lähde', 'Tili muuttunut -tieto', 'Lomakkeen numero', 'Tasotunnus'],
      sharedFields: ['Toimeksiantajan tieto-1', 'Toimeksiantajan tieto-2'],
      textField: 'Seliteteksti',
      totalAmountField: 'Tapahtuman rahamäärä',
      custom: {
        splitToLines: (s: string): string[] => {

          const ret: string[] = []

          for (let i = 0; i < s.length;) {
            if (s[i] !== 'T') {
              throw new InvalidFile('Parsing a file failed. Missing "T" in the beginning of the record.')
            }

            const len = parseInt(s.substring(i + 3, i + 6))
            const text = s.substring(i, i + len)
              .replace(/\]/g, 'Å')
              .replace(/\[/g, 'Ä')
              .replace(/\\/g, 'Ö')
              .replace(/\}/g, 'å')
              .replace(/\{/g, 'ä')
              .replace(/\|/g, 'ö')
            ret.push(text)

            i += len
            while (s.charCodeAt(i) === 10 || s.charCodeAt(i) === 13) {
              i++
            }
          }

          return ret
        },

        splitToColumns: (s: string): Record<string, string> => {
          if (s[0] !== 'T') {
            throw new InvalidFile('Parsing a line failed. Missing "T" in the beginning of the line.')
          }

          const code = s.substring(1, 3)
          let columns
          let extras

          switch (code) {

            // Header line.
            case '00':
              ref = undefined
              return {
                Tietuetunnus: code,
                ...this.parseFixedLength(s.substring(6), {
                  Versionumero: 3,
                  Tilinumero: 14,
                  'Tiliotteen numero': 3,
                  Tiliotekausi: 12,
                  Muodostumisaika: 10,
                  Asiakastunnus: 17,
                  'Alkusaldon pvm': 6,
                  'Tiliotteen alkusaldo': 19,
                  'Tiliotteen tietueiden lukumäärä': 6,
                  'Tilin valuutan tunnus': 3,
                  'Tilin nimi': 30,
                  'Tilin limiitti': 18,
                  'Tilin omistajan nimi': 35,
                  'Yhteydenottotieto-1': 40,
                  'Yhteydenottotieto-2': 40,
                  'Pankkikohtaista tietoa-1': 30,
                  'Pankkikohtaista tietoa-2': 30,
                }, {
                  Tiliotekausi: (s) => `20${s.substring(0, 2)}-${s.substring(2, 4)}-${s.substring(4, 6)} 20${s.substring(6, 8)}-${s.substring(8, 10)}-${s.substring(10, 12)}`,
                  Muodostumisaika: (s) => `20${s.substring(0, 2)}-${s.substring(2, 4)}-${s.substring(4, 6)} ${s.substring(6, 8)}:${s.substring(8, 10)}:00`,
                  'Alkusaldon pvm': (s) => `20${s.substring(0, 2)}-${s.substring(2, 4)}-${s.substring(4, 6)}`,
                  'Tiliotteen alkusaldo': (s) => `${parseInt(s) / 100}`,
                  'Tiliotteen tietueiden lukumäärä': (s) => `${parseInt(s)}`,
                  'Tilin limiitti': (s) => `${parseInt(s) / 100}`,
                })
              }

            // Basic transaction
            case '10':
              columns = {
                Tietuetunnus: code,
                ...this.parseFixedLength(s.substring(6), {
                  'Tapahtuman numero': 6,
                  Arkistointitunnus: 18,
                  Kirjauspäivä: 6,
                  Arvopäivä: 6,
                  Maksupäivä: 6,
                  Tapahtumatunnus: 1,
                  Koodi: 3,
                  Seliteteksti: 35,
                  'Tapahtuman rahamäärä': 19,
                  Kuittikoodi: 1,
                  Välitystapa: 1,
                  'Saaja/Maksaja': 35,
                  'Nimen lähde': 1,
                  'Saajan tili': 14,
                  'Tili muuttunut -tieto': 1,
                  Viite: 20,
                  'Lomakkeen numero': 8,
                  Tasotunnus: 1,
                }, {
                  Kirjauspäivä: (s) => `20${s.substring(0, 2)}-${s.substring(2, 4)}-${s.substring(4, 6)}`,
                  Arvopäivä: (s) => `20${s.substring(0, 2)}-${s.substring(2, 4)}-${s.substring(4, 6)}`,
                  Maksupäivä: (s) => `20${s.substring(0, 2)}-${s.substring(2, 4)}-${s.substring(4, 6)}`,
                  Viite: (s) => s.replace(/^0+/, ''),
                  'Tapahtuman rahamäärä': (s) => `${parseInt(s) / 100}`,
                })
              }
              ref = columns.Arkistointitunnus
              return columns

            // Additional information.
            case '11':
              columns = {
                Tietuetunnus: code,
                ...this.parseFixedLength(s.substring(6), {
                  'Lisätiedon tyyppi': 2,
                  Lisätieto: 999999
                }, {
                })
              }
              if (ref) {
                columns['Edellinen Arkistointitunnus'] = ref
              }
              extras = columns['Lisätieto']
              switch (columns['Lisätiedon tyyppi']) {
                case '00':
                  Object.assign(columns, {
                    ...this.parseFixedLength(extras, {
                      'Viesti-1': 35,
                      'Viesti-2': 35,
                      'Viesti-3': 35,
                      'Viesti-4': 35,
                      'Viesti-5': 35,
                      'Viesti-6': 35,
                      'Viesti-7': 35,
                      'Viesti-8': 35,
                      'Viesti-9': 35,
                      'Viesti-10': 35,
                      'Viesti-11': 35,
                      'Viesti-12': 35,
                    }, {})
                  })
                  break

                case '03':
                  Object.assign(columns, {
                    ...this.parseFixedLength(extras, {
                      'Kortin numero': 19,
                      Tyhjää: 1,
                      'Kaupan arkistoviite': 14,
                    }, {})
                  })
                  break

                case '06':
                  Object.assign(columns, {
                    ...this.parseFixedLength(extras, {
                      'Toimeksiantajan tieto-1': 35,
                      'Toimeksiantajan tieto-2': 35,
                    }, {
                      'Toimeksiantajan tieto-1': (s) => s.replace(/^0+/, ''),
                      'Toimeksiantajan tieto-2': (s) => s.replace(/^0+/, ''),
                    })
                  })
                  break

                case '11':
                  Object.assign(columns, {
                    ...this.parseFixedLength(extras, {
                      'Maksajan viite': 35,
                    }, {})
                  })
                  break

                default:
                  throw new NotImplemented(`Parsing a record of subtype '${columns['Lisätiedon tyyppi']}' is not implemented for record type 'T11'.`)
              }
              return columns

            // Balance record.
            case '40':
              return {
                Tietuetunnus: code,
                ...this.parseFixedLength(s.substring(6), {
                  Kirjauspäivä: 6,
                  'Kirjauspäivän loppusaldo': 19,
                  'Käytettävissä oleva saldo': 19,
                }, {
                  Kirjauspäivä: (s) => `20${s.substring(0, 2)}-${s.substring(2, 4)}-${s.substring(4, 6)}`,
                  'Kirjauspäivän loppusaldo': (s) => `${parseInt(s) / 100}`,
                  'Käytettävissä oleva saldo': (s) => `${parseInt(s) / 100}`,
                })
              }

            // Balance record.
            case '50':
              return {
                Tietuetunnus: code,
                ...this.parseFixedLength(s.substring(6), {
                  'Jakson tunnus': 1,
                  Jaksopäivä: 6,
                  'Panot Kappalemäärä': 8,
                  'Panot Summa': 19,
                  'Otot Kappalemäärä': 8,
                  'Otot Summa': 19,
                }, {
                  Jaksopäivä: (s) => `20${s.substring(0, 2)}-${s.substring(2, 4)}-${s.substring(4, 6)}`,
                  'Panot Summa': (s) => `${parseInt(s) / 100}`,
                  'Panot Kappalemäärä': (s) => `${parseInt(s)}`,
                  'Otot Summa': (s) => `${parseInt(s) / 100}`,
                  'Otot Kappalemäärä': (s) => `${parseInt(s)}`,
                })
              }

            // Notification record.
            case '70':
              return {
                Tietuetunnus: code,
                ...this.parseFixedLength(s.substring(6), {
                  'Pankkiryhmän tunnus': 3,
                  Tiedote: 80 * 6,
                }, {
                })
              }

            default:
              throw new NotImplemented(`Parsing a record of type 'T${code}' is not implemented.`)
          }
          return {}
        }
      }
    }
  }

  canHandle(file: ProcessFile): boolean {
    return file.startsWith('T00322100')
  }

  time(line: TextFileLine): Date | undefined {
    const date = line.columns['Kirjauspäivä'] || line.columns['Jaksopäivä'] || undefined
    return date ? new Date(date) : undefined
  }

  segmentId(line: TextFileLine): SegmentId | typeof NO_SEGMENT {
    return line.columns.Arkistointitunnus || line.columns['Edellinen Arkistointitunnus'] || NO_SEGMENT
  }
}
