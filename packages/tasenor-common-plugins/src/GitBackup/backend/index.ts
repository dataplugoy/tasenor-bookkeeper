import { BookkeeperImporter, GitRepo, KnexDatabase, systemPiped, TasenorExporter, ToolPlugin } from '@tasenor/common-node'
import { DirectoryPath, Email, error, FilePath, log, note, PluginCode, Timestring, Url, validGitRepoName, Version } from '@tasenor/common'
import fs from 'fs'
import path from 'path'
import { GitBackupCommit } from '../common/types'

// TODO: Master branch should be configurable.
// Branch.
const BRANCH = 'main'

// Mainly for temporary testing with file:/// repository.
const ALLOW_BAD_REPOSITORY = false

class GitBackup extends ToolPlugin {
  constructor() {
    super()

    this.code = 'GitBackup'as PluginCode
    this.title = 'Backup for Git'
    this.version = '1.0.4' as Version
    this.icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"></path></svg>'
    this.releaseDate = '2022-12-12'
    this.use = 'both'
    this.type = 'tool'
    this.description = 'Tool for backing up database to the git repository.'

    this.languages = {
    }
  }

  /**
   * Check if the resulting concatenation of paths points to the allowed working area of file system.
   */
  isValidWritePath(db: KnexDatabase, ...parts: string[]) {
    const resolved = path.resolve(...parts)
    const dir = path.resolve(this.getWorkSpace(db))

    return resolved.substring(0, dir.length) === dir
  }

  /**
   * Create backup every night.
   */
  async nightly(db: KnexDatabase) {
    await this.makeBackup(db, `Automatic nightly backup by ${this.code} ${this.version}`)
  }

  /**
   * Create manual dump.
   */
  async POST(db: KnexDatabase, data): Promise<unknown> {
    if (typeof data === 'object' && data !== null && data.makeBackup) {
      const success = await this.makeBackup(db, `${data.makeBackup}`)
      return { success }
    }
    return { success: false }
  }

  /**
   * List of the latest backup commits.
   */
  async GET(db: KnexDatabase, data): Promise<unknown> {
    if (typeof data === 'object' && data !== null && data.type === 'commits') {
      const commits = await this.collectCommits(db, data.count || 10)
      return { success: true, data: { commits } }
    }
    return { success: false }
  }

  /**
   * Restore from the backup.
   */
  async PUT(db: KnexDatabase, data): Promise<unknown> {
    if (typeof data === 'object' && data !== null && !!data.commit) {
      const success = await this.restoreBackup(db, data.commit)
      return { success }
    }
    return { success: false }
  }

  /**
   * A helper to check settings and set up repository for further use.
   */
  private async setupRepository(db: KnexDatabase): Promise<null | {
    workDir: DirectoryPath,
    repository: Url,
    subDirectory: DirectoryPath,
    sshPrivateKey: string,
    sshPath: FilePath,
    backupDir: DirectoryPath,
    repo: GitRepo,
  }> {
    const workDir = this.getWorkSpace(db)
    const repository = await this.getSetting(db, 'repository')
    const subDirectory = await this.getSetting(db, 'subDirectory')
    const sshPrivateKey = await this.getSetting(db, 'sshPrivateKey')

    // Skip if not configured for use.
    if (repository === undefined || subDirectory === undefined) {
      error('Cannot make backup since no repository or subdirectory configured.')
      return null
    }

    // Check repo URL.
    if (!ALLOW_BAD_REPOSITORY && !validGitRepoName(repository)) {
      error(`Bad repository address ${JSON.stringify(repository)}.`)
      return null
    }

    // Set up SSH if needed.
    const sshPath: FilePath = path.join(workDir, 'ssh.key') as FilePath
    fs.writeFileSync(sshPath, '')
    fs.chmodSync(sshPath, 0o600)

    if (sshPrivateKey) {
      fs.appendFileSync(sshPath, sshPrivateKey)
      fs.appendFileSync(sshPath, '\n')
    }

    // Verify the resulting work directory.
    const repoName = GitRepo.defaultName(repository)
    if (!this.isValidWritePath(db, workDir, repoName, subDirectory)) {

      error(`A sub directory '${subDirectory}' does not produce valid allowed work directory for backup in DB '${db.client.config.connection.database}'.`)
      return null
    }

    const backupDir = path.join(workDir, repoName, subDirectory) as DirectoryPath

    // Instantiate and configure Git.
    const repo = await GitRepo.get(repository, workDir)
    if (!repo) {
      error(`Failed to establish git repository instance '${repository}' into ${workDir}.`)
      return null
    }
    repo.branch = BRANCH
    repo.configure({
      name: 'Tasenor',
      email: 'communications.tasenor@gmail.com' as Email,
      sshPrivateKey: sshPrivateKey ? sshPath : null,
    })

    return {
      workDir, repository, subDirectory, sshPrivateKey, sshPath, backupDir, repo
    }
  }

  /**
   * Get a list of commits.
   */
  async collectCommits(db: KnexDatabase, limit: number): Promise<GitBackupCommit[]> {
    const setup = await this.setupRepository(db)
    if (!setup) {
      return []
    }
    const { repo } = setup

    log(`Fetching commit list for DB '${db.client.config.connection.database}'.`)
    await repo.update()
    try {
      const gitLog = await repo.git.log({ maxCount: limit })
      return gitLog.all.map(e => ({
        hash: e.hash,
        date: e.date as Timestring,
        message: e.message,
        author: `${e.author_name} ${e.author_email ? '<' + e.author_email + '>' : ''}`.trim()
      }))
    } catch (err) {
      error(`Failed to get log from git repository for DB '${db.client.config.connection.database}'.`)
      return []
    }
  }

  /**
   * Execute backup making for a database.
   */
  async makeBackup(db: KnexDatabase, message: string): Promise<boolean> {

    const setup = await this.setupRepository(db)
    if (!setup) {
      return false
    }
    const { subDirectory, repo, backupDir } = setup

    log(`Making a backup into '${subDirectory}' of DB '${db.client.config.connection.database}'.`)
    await repo.update()
    await this.dump(db, backupDir)
    return repo.put(message, subDirectory)
  }

  /**
   * Read in database from the give giot hash.
   */
  async restoreBackup(db: KnexDatabase, commit: string): Promise<boolean> {

    const setup = await this.setupRepository(db)
    if (!setup) {
      return false
    }
    const { repo, backupDir } = setup

    log(`Restoting a backup into '${backupDir}' for DB '${db.client.config.connection.database}' from hash '${commit}'.`)
    await repo.update()
    try {
      await repo.git.checkout(commit)
    } catch (err) {
      error(`Checking out the hash '${commit}' failed: ${err}`)
      return false
    }
    await this.restore(db, backupDir)

    return true
  }

  /**
   * Write the data from the database to the directory.
   */
  private async dump(db: KnexDatabase, dir: DirectoryPath) {

    note(`Creating backup into '${dir}'.`)

    if (fs.existsSync(dir)) {
      log(`Removing old data from '${dir}'.`)
      fs.rmSync(dir, { recursive: true })
    }
    const exportDir = path.join(dir, 'export') as DirectoryPath
    fs.mkdirSync(exportDir, { recursive: true })

    // This dump.sql is not really needed, but it is kind of safety net for failures
    // in export and import code. It helps to rebuild database manually, if all else
    // fails.
    // TODO: Check for pg_dump crash. What if that happens?
    const { host, port, database, user, password } = db.client.config.connection
    const url = `postgresql://${user}:${password}@${host}:${port}/${database}`
    await systemPiped(`pg_dump -c ${url} > "${dir}/dump.sql"`)

    const exporter = new TasenorExporter()
    await exporter.dump(db, exportDir)
  }

  /**
   * Read the data to the database from the directory.
   */
  private async restore(db: KnexDatabase, dir: DirectoryPath): Promise<void> {
    const importer = new BookkeeperImporter()
    await importer.restoreUser(db, path.join(dir, 'export') as DirectoryPath)
  }
}

export default GitBackup
