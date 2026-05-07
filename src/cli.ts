import { resolve, basename } from 'node:path'
import { existsSync } from 'node:fs'
import { cp, rm, mkdtemp, readFile, writeFile, symlink, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { Command } from 'commander'
import chalk from 'chalk'
import validatePackageName from 'validate-npm-package-name'

import type { CliOptions, ProjectSummary } from './types.js'

const TEMPLATE_REPO_NAME = 'swar-templates'
const GITHUB_REPO = `https://github.com/netlify/${TEMPLATE_REPO_NAME}.git`
const MANIFEST_URL = `https://raw.githubusercontent.com/netlify/${TEMPLATE_REPO_NAME}/main/manifest.json`

type StarterEntry = { id: string; framework?: string }

// In `--json` mode, all human-readable progress messages go to stderr so stdout
// stays a single parseable JSON document for callers like Claude Code.
let jsonMode = false

function info(msg: string): void {
  if (jsonMode) process.stderr.write(msg + '\n')
  else process.stdout.write(msg + '\n')
}

function warn(msg: string): void {
  if (jsonMode) process.stderr.write(msg + '\n')
  else process.stderr.write(msg + '\n')
}

function bail(code: string, message: string): never {
  if (jsonMode) {
    process.stdout.write(JSON.stringify({ error: message, code }) + '\n')
  } else {
    process.stderr.write(chalk.red(message) + '\n')
  }
  process.exit(1)
}

// Local mirror produced by the SWAR build cache via `utils.cache.save("./swar-templates")`.
// Netlify Build's plugin runtime is configured with `cacheDir = /opt/build/cache` (passed in by
// buildbot as `b.paths.Cache`), so the entry lands at `<NETLIFY_BUILD_BASE>/cache/cwd/<name>/`.
// The `cwd` segment is added by `@netlify/cache-utils` to namespace by base. Buildbot exports
// `NETLIFY_BUILD_BASE` to the agent-runner subprocess, which is inherited by ts-cli via execa.
function localMirrorDir(): string | undefined {
  const buildBase = process.env.NETLIFY_BUILD_BASE
  if (!buildBase) return undefined
  const dir = join(buildBase, 'cache', 'cwd', TEMPLATE_REPO_NAME)
  return existsSync(dir) ? dir : undefined
}

function bailGitHubUnreachable(operation: string): never {
  bail(
    'github_unreachable',
    `Could not ${operation} from GitHub and no local ${TEMPLATE_REPO_NAME} mirror is available. ` +
      `GitHub may be experiencing an outage. Please try again in a few minutes.`,
  )
}

async function readLocalManifest<T>(dir: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf-8')) as T
  } catch {
    return undefined
  }
}

async function loadManifest<T>(): Promise<T> {
  try {
    return (await fetch(MANIFEST_URL).then((r) => r.json())) as T
  } catch {
    const dir = localMirrorDir()
    if (!dir) bailGitHubUnreachable('fetch manifest')
    const parsed = await readLocalManifest<T>(dir)
    if (!parsed) bailGitHubUnreachable('fetch manifest')
    warn(chalk.yellow(`⚠ Could not reach GitHub, using local ${TEMPLATE_REPO_NAME} copy`))
    return parsed
  }
}

interface ResolvedSource {
  srcDir: string
  frameworkId: string | undefined
  cleanup: () => Promise<void>
}

// Remove the local mirror written by the SWAR build cache, regardless of whether ts-cli ended up
// using it. Otherwise it gets re-saved into the user's site cache on every build going forward.
async function cleanupLocalMirror(): Promise<void> {
  const buildBase = process.env.NETLIFY_BUILD_BASE
  if (!buildBase) return
  const cacheCwd = join(buildBase, 'cache', 'cwd')
  await rm(join(cacheCwd, TEMPLATE_REPO_NAME), { recursive: true, force: true })
  await rm(join(cacheCwd, `${TEMPLATE_REPO_NAME}.netlify.cache.json`), { force: true })
}

// Resolve where to copy template files from. First try a sparse clone from GitHub. If that fails
// and a local mirror is available, fall back to it and re-resolve `frameworkId` from the mirror's
// manifest (the GitHub manifest we already loaded may reference a starter or framework that the
// SWAR build cache hasn't picked up yet).
async function resolveSourceDir(
  starterId: string,
  githubFrameworkId: string | undefined,
): Promise<ResolvedSource> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'netlify-cta-'))
  try {
    info(chalk.gray('⟳ Fetching template...'))
    const sparsePaths = [
      `starters/${starterId}`,
      ...(githubFrameworkId ? [`frameworks/${githubFrameworkId}`] : []),
    ]
    execSync(`git clone --depth=1 --sparse ${GITHUB_REPO} ${tmpDir}`, { stdio: 'pipe' })
    execSync(`git -C ${tmpDir} sparse-checkout set ${sparsePaths.join(' ')}`, { stdio: 'pipe' })
    return {
      srcDir: tmpDir,
      frameworkId: githubFrameworkId,
      cleanup: async () => {
        await rm(tmpDir, { recursive: true, force: true })
        await cleanupLocalMirror()
      },
    }
  } catch {
    await rm(tmpDir, { recursive: true, force: true })
    const mirror = localMirrorDir()
    if (!mirror) bailGitHubUnreachable('clone template repo')
    warn(chalk.yellow(`⚠ Could not clone template repo, using local ${TEMPLATE_REPO_NAME} copy`))

    const localManifest = await readLocalManifest<{ starters: StarterEntry[] }>(mirror)
    if (!localManifest) bailGitHubUnreachable('clone template repo')
    const frameworkId = localManifest.starters.find((s) => s.id === starterId)?.framework
    return { srcDir: mirror, frameworkId, cleanup: cleanupLocalMirror }
  }
}

function sanitizePackageName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^[^a-z]+/, '')
    .replace(/-+/g, '-')
    .replace(/-$/, '')
}

function getCurrentDirectoryName(): string {
  return basename(process.cwd())
}

function validateProjectName(name: string) {
  const { validForNewPackages, validForOldPackages, errors, warnings } =
    validatePackageName(name)
  const error = errors?.[0] || warnings?.[0]

  return {
    valid: validForNewPackages && validForOldPackages,
    error:
      error?.replace(/name/g, 'Project name') ||
      'Project name does not meet npm package naming requirements',
  }
}

function getPackageManagerFromUserAgent(): string | undefined {
  const userAgent = process.env.npm_config_user_agent
  if (!userAgent) return undefined
  const pmSpec = userAgent.split(' ')[0]
  const separatorPos = pmSpec.lastIndexOf('/')
  return separatorPos !== -1 ? pmSpec.substring(0, separatorPos) : pmSpec
}

const SUMMARY_IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.output',
  '.turbo',
  '.cache',
  '.vercel',
  '.netlify',
  'coverage',
])

async function walkProjectFiles(root: string): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string, rel: string): Promise<void> {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (SUMMARY_IGNORE_DIRS.has(entry.name)) continue
      const relPath = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        await walk(join(dir, entry.name), relPath)
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        out.push(relPath)
      }
    }
  }
  await walk(root, '')
  out.sort()
  return out
}

async function findAgentInstructions(root: string): Promise<string[]> {
  const found: string[] = []
  for (const candidate of ['CLAUDE.md', 'AGENTS.md', '.claude/CLAUDE.md', '.claude/AGENTS.md']) {
    if (existsSync(join(root, candidate))) found.push(candidate)
  }
  for (const sub of ['agents', 'skills', 'commands']) {
    const dir = join(root, '.claude', sub)
    if (!existsSync(dir)) continue
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      for (const e of entries) {
        if (e.isFile()) found.push(`.claude/${sub}/${e.name}`)
      }
    } catch {
      // ignore
    }
  }
  return found
}

async function readPackageJsonSummary(
  root: string,
): Promise<ProjectSummary['packageJson']> {
  const path = join(root, 'package.json')
  if (!existsSync(path)) return undefined
  try {
    const pkg = JSON.parse(await readFile(path, 'utf-8'))
    return {
      path: 'package.json',
      name: typeof pkg.name === 'string' ? pkg.name : undefined,
      scripts: (pkg.scripts ?? {}) as Record<string, string>,
      dependencies: Object.keys(pkg.dependencies ?? {}),
      devDependencies: Object.keys(pkg.devDependencies ?? {}),
    }
  } catch {
    return undefined
  }
}

function buildNextSteps(
  targetDir: string,
  pm: string,
  installRan: boolean,
  scripts: Record<string, string> | undefined,
): ProjectSummary['nextSteps'] {
  const commands: { label: string; command: string }[] = []
  if (!installRan) commands.push({ label: 'install', command: `${pm} install` })
  for (const name of ['dev', 'build', 'start', 'test']) {
    if (scripts && scripts[name]) {
      commands.push({ label: name, command: `${pm} run ${name}` })
    }
  }
  return { cd: targetDir, commands }
}

export function cli() {
  const program = new Command()

  program
    .name('netlify-cta')
    .description('CLI to create a new Netlify TanStack Start application')

  program.argument('[project-name]', 'name of the project')

  program
    .option('--no-install', 'skip installing dependencies')
    .option(
      '--package-manager <pm>',
      'explicitly tell the CLI to use this package manager',
    )
    .option('--add-ons [id]', 'starter ID to use from the template repo')
    .option('--list-addons-json', 'list all available starters as JSON', false)
    .option('--no-git', 'do not create a git repository')
    .option(
      '--target-dir <path>',
      'the target directory for the application root',
    )
    .option(
      '--json',
      'emit a machine-readable JSON summary of the created project on stdout (logs go to stderr)',
      false,
    )

  program.action(async (projectName: string | undefined, options: CliOptions) => {
    jsonMode = options.json === true

    // Handle --list-addons-json
    if (options.listAddonsJson) {
      const manifest = await loadManifest<{ starters: unknown }>()
      process.stdout.write(JSON.stringify(manifest.starters, null, 2) + '\n')
      process.exit(0)
    }

    // Resolve starter ID
    const starterId =
      typeof options.addOns === 'string' ? options.addOns : 'basic'

    // Resolve target directory — default to CWD
    const targetDir = options.targetDir ? resolve(options.targetDir) : resolve(process.cwd())

    // Resolve project name for package.json
    let resolvedProjectName: string
    if (projectName && projectName !== '.') {
      resolvedProjectName = sanitizePackageName(projectName)
    } else {
      resolvedProjectName = sanitizePackageName(getCurrentDirectoryName())
    }

    const { valid, error } = validateProjectName(resolvedProjectName)
    if (!valid) {
      bail('invalid_project_name', error)
    }

    // Delete index.html if it exists in the target directory
    const indexHtmlPath = join(targetDir, 'index.html')
    if (existsSync(indexHtmlPath)) {
      await rm(indexHtmlPath)
    }

    info(
      chalk.bold.cyan(
        `Creating a new Netlify TanStack Start app in directory ${chalk.white(targetDir)}...`,
      ),
    )
    info(chalk.gray(`Using starter: ${starterId}`))

    // Fetch manifest to resolve frameworkId for this starter
    const manifest = await loadManifest<{ starters: StarterEntry[] }>()
    const githubFrameworkId = manifest.starters.find((s) => s.id === starterId)?.framework

    const { srcDir, frameworkId, cleanup } = await resolveSourceDir(starterId, githubFrameworkId)
    try {
      const starterPath = join(srcDir, 'starters', starterId)
      if (!existsSync(starterPath)) {
        bail(
          'starter_not_found',
          `Starter "${starterId}" not found in the template repository. Run --list-addons-json to see available starters.`,
        )
      }

      // Copy starter files to target directory
      await cp(starterPath, targetDir, { recursive: true })

      // Copy framework overlay files if they exist
      if (frameworkId) {
        const frameworkPath = join(srcDir, 'frameworks', frameworkId)
        if (existsSync(frameworkPath)) {
          info(chalk.gray(`⟳ Applying framework overlay (${frameworkId})...`))
          await cp(frameworkPath, targetDir, { recursive: true })
          info(chalk.green(`✓ Framework overlay applied (${frameworkId})`))
        } else {
          info(chalk.yellow(`⚠ Framework overlay "${frameworkId}" not found in repo, skipping`))
        }
      }

      // Update package.json name if a project name was provided
      if (projectName && projectName !== '.') {
        const pkgPath = join(targetDir, 'package.json')
        if (existsSync(pkgPath)) {
          const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
          pkg.name = resolvedProjectName
          await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
        }
      }

      info(chalk.green(`✓ Template copied`))
    } finally {
      await cleanup()
    }

    // Initialize git repository
    let gitInitialized = false
    if (options.git !== false) {
      try {
        execSync('git init', { cwd: targetDir, stdio: 'pipe' })
        gitInitialized = true
        info(chalk.green('✓ Initialized git repository'))
      } catch {
        warn(chalk.yellow('⚠ Could not initialize git repository'))
      }
    }

    // Install dependencies
    const pm =
      options.packageManager ??
      getPackageManagerFromUserAgent() ??
      'pnpm'
    let installRan = false
    let installCommand: string | undefined
    if (options.install !== false) {
      info(chalk.gray(`⟳ Installing dependencies with ${pm}...`))
      try {
        let cmd = `${pm} install`
        if (pm === 'npm') {
          cmd += ' --no-audit --no-fund --prefer-offline'
          info(chalk.gray(`  ${cmd}`))
        }
        installCommand = cmd
        // In JSON mode, redirect install's stdout to our stderr so the JSON
        // summary stays the only thing on stdout.
        execSync(cmd, {
          cwd: targetDir,
          stdio: jsonMode ? ['ignore', 2, 'inherit'] : 'inherit',
        })
        installRan = true
        info(chalk.green('✓ Dependencies installed'))
      } catch {
        process.stderr.write(
          chalk.red(`Failed to install dependencies. Run \`${pm} install\` manually.`) + '\n',
        )
      }
    }

    // Symlink .agents → .claude if .claude exists
    const claudeDir = join(targetDir, '.claude')
    if (existsSync(claudeDir)) {
      const agentsDir = join(targetDir, '.agents')
      if (!existsSync(agentsDir)) {
        await symlink('.claude', agentsDir, 'dir')
        info(chalk.green('✓ Linked .agents → .claude'))
      }
    }

    if (jsonMode) {
      const pkgSummary = await readPackageJsonSummary(targetDir)
      const summary: ProjectSummary = {
        schemaVersion: 1,
        targetDir,
        projectName: pkgSummary?.name ?? resolvedProjectName,
        starter: { id: starterId, framework: frameworkId },
        git: { initialized: gitInitialized },
        packageManager: pm,
        install: { ran: installRan, command: installCommand },
        packageJson: pkgSummary,
        agentInstructions: await findAgentInstructions(targetDir),
        files: await walkProjectFiles(targetDir),
        nextSteps: buildNextSteps(targetDir, pm, installRan, pkgSummary?.scripts),
      }
      process.stdout.write(JSON.stringify(summary, null, 2) + '\n')
      return
    }

    info(chalk.bold.green('\nDone! Your project is ready.'))
    info(chalk.white('\nNext steps:'))
    info(chalk.cyan(`  cd ${basename(targetDir)}`))
    if (options.install === false) {
      info(chalk.cyan(`  ${pm} install`))
    }
    info(chalk.cyan('  pnpm dev'))
  })

  program.parse()
}
