#!/usr/bin/env node
import fs from 'fs'

function conf(env) {
  const value = process.env[env]
  if (value === undefined) {
    throw new Error(`Must set an environment variable ${env}.`)
  }
  return value
}

if (process.argv.length < 3) {
  console.log(`Usage: ${process.argv[1]} <config-path>`)
} else {
  const title = conf('DOCCER_TITLE')
  const repos = conf('DOCCER_REPOS').split(' ')
  const config = {
    title,
    repositories: {}
  }
  repos.forEach(repo => {
    const name = repo.split('/').pop().replace(/\.git$/, '')
    config.repositories[name] = {
      git: repo,
      modules: ['src/index.ts']
    }
  })
  fs.writeFileSync(process.argv[2], JSON.stringify(config, null, 2) + '\n')
  console.log('Written to', process.argv[2])
  console.dir(config, { depth: null })
}
