import { DirectoryPath, Email, error, FilePath, log, Url, warning } from '@dataplug/tasenor-common'
import simpleGit, { SimpleGit } from 'simple-git'
import gitUrlParse from 'git-url-parse'
import fs from 'fs'
import glob from 'fast-glob'
import path from 'path'
import { systemPiped } from '../system'

/**
 * A git repo storage.
 */
export class GitRepo {

  url: Url
  rootDir: DirectoryPath
  name: string
  git: SimpleGit

  constructor(url: Url, rootDir: DirectoryPath) {
    this.url = url
    this.name = GitRepo.defaultName(url)
    this.setDir(rootDir)
    this.git.outputHandler(function(command, stdout, stderr) {
      stdout.on('data', (str) => log(`GIT: ${str}`.trim()))
      stderr.on('data', (str) => warning(`GIT: ${str.toString('utf-8')}`.trim()))
    })
  }

  get fullPath() : FilePath {
    return path.join(this.rootDir, this.name) as FilePath
  }

  /**
   * Set the git configuration.
   */
  configure(name: string, email: Email) {
    this.git.addConfig('user.name', name).addConfig('user.email', email)
  }

  /**
   * Initialize root path and instantiate Simple Git if path exists.
   */
  setDir(rootDir: DirectoryPath) {
    this.rootDir = rootDir
    if (fs.existsSync(this.fullPath)) {
      this.git = simpleGit({ baseDir: this.fullPath })
    } else {
      this.git = simpleGit()
    }
  }

  /**
   * Delete all if repo exists.
   */
  async clean(): Promise<void> {
    if (!fs.existsSync(this.fullPath)) {
      return
    }
    await fs.promises.rm(this.fullPath, { recursive: true })
  }

  /**
   * Clone the repo if it is not yet there. Return true if the repo is available.
   */
  async fetch(): Promise<boolean> {
    if (fs.existsSync(this.fullPath)) {
      return true
    }
    return this.git.clone(this.url, this.fullPath)
      .then(() => {
        this.setDir(this.rootDir)
        return true
      })
      .catch(() => {
        error(`Git fetch from ${this.url} failed.`)
        return false
      })
  }

  /**
   * List files from repo returning local relative paths.
   */
  glob(pattern: string): string[] {
    const N = this.fullPath.length
    return glob.sync(this.fullPath + '/' + pattern).map((s: string) => {
      if (s.substring(0, N) !== this.fullPath) {
        throw new Error(`Strage. Glob found a file ${s} from repo ${this.fullPath}.`)
      }
      return s.substring(N + 1)
    })
  }

  /**
   * Add, commit and push the given files and/or directories.
   */
  async put(message: string, ...subPaths: (FilePath | DirectoryPath)[]): Promise<boolean> {
    let fail = false
    await this.git.add(subPaths).catch(err => {
      error(`Git add failed: ${err}`)
      fail = true
    })
    await this.git.commit(message).catch(err => {
      error(`Git commit failed: ${err}`)
      fail = true
    })
    await this.git.push().catch(err => {
      error(`Git push failed: ${err}`)
      fail = true
    })

    return fail
  }

  /**
   * Gather all repos found from the directory.
   */
  static async all(dir: DirectoryPath): Promise<GitRepo[]> {
    const repos: GitRepo[] = []
    const dotGits = glob.sync(dir + '/*/.git')
    for (const dotGit of dotGits) {
      const dir = path.dirname(dotGit) as DirectoryPath
      const remote = (await simpleGit(dir).getRemotes(true)).find(r => r.name === 'origin')
      if (remote) {
        repos.push(new GitRepo(remote.refs.fetch as Url, dir))
      }
    }
    return repos
  }

  /**
   * Extract default name from repo URL.
   */
  static defaultName(repo: Url): string {
    const { pathname } = gitUrlParse(repo)
    return path.basename(pathname).replace(/\.git/, '')
  }

  /**
   * Ensure repo is downloaded and return repo instance.
   */
  static async get(repoUrl: Url, parentDir: DirectoryPath, runYarnInstall: boolean = false): Promise<GitRepo | undefined> {
    const repo = new GitRepo(repoUrl, parentDir)
    const fetched = await repo.fetch()

    if (fetched && runYarnInstall) {
      await systemPiped(`cd "${repo.fullPath}" && yarn install`)
    }

    return fetched ? repo : undefined
  }
}
