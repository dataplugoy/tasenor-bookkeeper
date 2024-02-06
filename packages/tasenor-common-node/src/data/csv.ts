import fs from 'fs'
import { parse } from 'csv-parse'
import { FilePath } from '@tasenor/common'

/**
 * Read in CSV file.
 */
export async function loadCSVfile(path: FilePath): Promise<string[][]> {
  return new Promise((resolve, reject) => {

    const data = fs.readFileSync(path).toString('utf-8')
    const parser = parse({
      delimiter: ','
    })
    const result:string[][] = []

    parser.on('readable', function(){
      let record: string[];
      while ((record = parser.read()) !== null) {
        result.push(record)
      }
    })
    parser.on('error', function(err){
      console.error(err.message);
    })
    parser.on('end', () => resolve(result))
    parser.write(data)
    parser.end()
  })
}
