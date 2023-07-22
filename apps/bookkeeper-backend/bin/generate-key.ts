import { Crypto } from '@dataplug/tasenor-common'

async function main() {
  console.log('Key:\n')
  console.log(await Crypto.generateKey())
  console.log()
}

main().catch(err => { console.error(`${process.argv.join(' ')}: Error exit: ${err}`); process.exit(-1) }).then(() => process.exit())
