import { GitRepo, KnexDatabase, systemPiped, TasenorExporter, ToolPlugin } from '@tasenor/common-node'
import { DirectoryPath, Email, error, log, note, PluginCode, Version } from '@tasenor/common'
import fs from 'fs'
import path from 'path'

class GitBackup extends ToolPlugin {
  constructor() {
    super()

    this.code = 'GitBackup'as PluginCode
    this.title = 'Backup for Git'
    this.version = '1.0.2' as Version
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
   * Execute backup making for a database.
   */
  async makeBackup(db: KnexDatabase, message: string): Promise<boolean> {
    const workDir = this.getWorkSpace(db)
    const repository = await this.getSetting(db, 'repository')
    const subDirectory = await this.getSetting(db, 'subDirectory')

    // Skip if not configured for use.
    if (repository === undefined || subDirectory === undefined) {
      return false
    }

    const repoName = GitRepo.defaultName(repository)

    if (!this.isValidWritePath(db, workDir, repoName, subDirectory)) {

      error(`A sub directory '${subDirectory}' does not produce valide allowed work directory for backup in DB '${db.client.config.connection.database}'.`)
      return false

    } else {

      log(`Making a backup into '${subDirectory}' of DB '${db.client.config.connection.database}'.`)
      const repo = await GitRepo.get(repository, workDir)
      if (repo) {
        repo.configure('Tasenor', 'tasenor@gmail.com' as Email)
        const backupDir = path.join(workDir, repoName, subDirectory) as DirectoryPath
        await this.dump(db, backupDir)
        await repo.put(message, subDirectory)
        return true
      }
      return false
    }
  }

  /**
   * Write the data from the database to the directory.
   */
  async dump(db: KnexDatabase, dir: DirectoryPath) {

    note(`Creating backup into '${dir}'.`)

    if (fs.existsSync(dir)) {
      log(`Removing old data from '${dir}'.`)
      fs.rmSync(dir, { recursive: true })
    }
    const exportDir = path.join(dir, 'export') as DirectoryPath
    fs.mkdirSync(exportDir, { recursive: true })
    // TODO: Check for pg_dump crash. What if that happens?
    const { host, port, database, user, password } = db.client.config.connection
    const url = `postgresql://${user}:${password}@${host}:${port}/${database}`
    await systemPiped(`pg_dump -c ${url} > "${dir}/dump.sql"`)

    const exporter = new TasenorExporter()
    await exporter.dump(db, exportDir)
  }
}

export default GitBackup
