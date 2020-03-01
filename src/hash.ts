import { execSync } from 'child_process'
import crypto from 'crypto'
import { resolve } from 'path'
import stripAnsi from 'strip-ansi'
import findWorkspaceRoot from 'find-yarn-workspace-root'

interface HashOptions {
  path: string
  verbose?: boolean
}

type WorkspaceInfoResult = Record<string, WorkspaceInfoResultItem>

interface WorkspaceInfoResultItem {
  location: string
  workspaceDependencies: string[]
  mismatchedworkspaceDependencies: string[]
}

export async function hash({ path, verbose = false }: HashOptions) {
  path = resolve(process.cwd(), path)

  const pkgName = resolve(path, 'package.json')
  const pkg = require(pkgName)
  if (!pkg.name) {
    throw new Error(`package doesn't have a name.`)
  }

  const rootpath = findWorkspaceRoot(path)
  if (!rootpath) {
    throw new Error(`cannot find workspace root path.`)
  }

  const output = stripAnsi(
    execSync('yarn workspaces --silent info', {
      cwd: path,
      stdio: 'pipe',
      encoding: 'utf8',
    }),
  )

  const result: WorkspaceInfoResult = JSON.parse(output.trim())
  const deps = new Map<string, WorkspaceInfoResultItem>()

  const resolveDependency = (workspaceName: string) => {
    if (deps.has(workspaceName)) {
      return
    }

    const workspace = result[workspaceName]
    if (!workspace) {
      throw new Error(`cannot find workspace ${workspaceName}`)
    }

    deps.set(workspaceName, workspace)

    for (const dep of workspace.workspaceDependencies) {
      resolveDependency(dep)
    }
  }

  resolveDependency(pkg.name)

  const commitHashes = Array.from(deps)
    .sort(([lhs], [rhs]) => lhs > rhs ? 1 : -1)
    .map(([_, workspace]) => {
      const workspacePath = resolve(rootpath, workspace.location)
      const commitHash = getGitCommitHash(workspacePath)
      if (verbose) {
        console.log(`[hash-workspace] "${workspacePath}"=${commitHash}`)
      }
      return commitHash
    })

  return crypto.createHash('md5')
    .update(commitHashes.join('_'))
    .digest('hex')
    .substr(0, 21)
}

function getGitCommitHash(path: string) {
  const output = execSync(`git rev-list -1 HEAD -- ${path}`, {
    encoding: 'utf8',
    cwd: path,
  })
  return output.trim()
}
