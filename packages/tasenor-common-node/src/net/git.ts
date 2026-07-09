import { DirectoryPath, Email, error, FilePath, log, Url, warning } from '@tasenor/common'
import simpleGit, { SimpleGit } from 'simple-git'
import gitUrlParse from 'git-url-parse'
import fs from 'fs'
import glob from 'fast-glob'
import path from 'path'
import { systemPiped } from '../system'

/**
 * Outcome of a {@link GitRepo.put}. `reason` distinguishes the non-fatal `unchanged`
 * (nothing to commit) from failures like `too-large` (a blob exceeds the remote's file
 * size limit) so callers can report each case separately.
 */
export type GitPutResult = {
  success: boolean
  reason?: 'unchanged' | 'update-failed' | 'add-failed' | 'commit-failed' | 'push-failed' | 'too-large'
}

/**
 * A git repo storage.
 */
export class GitRepo {

  url: Url
  rootDir: DirectoryPath
  name: string
  branch: string
  git: SimpleGit

  constructor(url: Url, rootDir: DirectoryPath) {
    this.branch = 'master'
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
  configure(conf: { name: string, email: Email, sshPrivateKey: FilePath | null }) {
    this.git.addConfig('user.name', conf.name).addConfig('user.email', conf.email)
    // Trust the remote host on first use (accept-new) and keep known_hosts next to the
    // private key in the writable workspace. Without this a fresh container has no
    // known_hosts entry, so every push/pull fails with "Host key verification failed".
    if (conf.sshPrivateKey) {
      const knownHosts = path.join(path.dirname(conf.sshPrivateKey), 'known_hosts')
      this.git.env('GIT_SSH_COMMAND', `ssh -i "${conf.sshPrivateKey}" -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="${knownHosts}"`)
    } else {
      this.git.env('GIT_SSH_COMMAND', 'ssh -o StrictHostKeyChecking=accept-new')
    }
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async put(message: string, ...subPaths: (FilePath | DirectoryPath)[]): Promise<GitPutResult> {
    if (!await this.update()) {
      return { success: false, reason: 'update-failed' }
    }

    let addFailed = false
    await this.git.add('.').catch(err => {
      error(`Git add failed: ${err}`)
      addFailed = true
    })
    if (addFailed) {
      return { success: false, reason: 'add-failed' }
    }

    // Only commit if something is actually staged; otherwise this is a no-op backup and we
    // must not call `git commit` (it would fail with "nothing to commit").
    const staged = await this.git.diff(['--cached', '--name-only']).catch(() => '')
    const hasChanges = staged.trim().length > 0
    if (hasChanges) {
      let commitFailed = false
      await this.git.commit(message).catch(err => {
        error(`Git commit failed: ${err}`)
        commitFailed = true
      })
      if (commitFailed) {
        return { success: false, reason: 'commit-failed' }
      }
    }

    // Push regardless, to flush this commit plus any earlier commits not yet on the remote.
    let pushError: unknown = null
    await this.git.push().catch(err => {
      pushError = err
      error(`Git push failed: ${err}`)
    })
    if (pushError) {
      const msg = `${pushError}`
      // GitHub (and similar hosts) reject any blob over a hard per-file size limit.
      if (/GH001|file size limit|exceeds .*size|large files? detected/i.test(msg)) {
        return { success: false, reason: 'too-large' }
      }
      return { success: false, reason: 'push-failed' }
    }

    return hasChanges ? { success: true } : { success: true, reason: 'unchanged' }
  }

  /**
   * Pull the latest.
   */
  async update(): Promise<boolean> {
    let fail = false

    await this.git.checkout(this.branch).catch(err => {
      error(`Git pull failed: ${err}`)
      fail = true
    })
    if (!fail) {
      await this.git.pull().catch(err => {
        error(`Git pull failed: ${err}`)
        fail = true
      })
    }
    return !fail
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
  static async get(repoUrl: Url, parentDir: DirectoryPath, runYarnInstall = false): Promise<GitRepo | undefined> {
    const repo = new GitRepo(repoUrl, parentDir)
    const fetched = await repo.fetch()

    if (fetched && runYarnInstall) {
      await systemPiped(`cd "${repo.fullPath}" && yarn install`)
    }

    return fetched ? repo : undefined
  }
}
