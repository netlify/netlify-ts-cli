import { resolve, basename } from 'node:path'
import { existsSync } from 'node:fs'
import { cp, rm, mkdtemp, readFile, writeFile, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { Command } from 'commander'
import chalk from 'chalk'
import validatePackageName from 'validate-npm-package-name'

import type { CliOptions } from './types.js'

const TEMPLATE_REPO_NAME = 'swar-templates'
const GITHUB_REPO = `https://github.com/netlify/${TEMPLATE_REPO_NAME}.git`
const MANIFEST_URL = `https://raw.githubusercontent.com/netlify/${TEMPLATE_REPO_NAME}/main/manifest.json`

type StarterEntry = { id: string; framework?: string }

// Local mirror produced by the SWAR build cache via `utils.cache.save("./swar-templates")`.
// The `cwd` segment is added by `@netlify/cache-utils` to namespace the cache by base
// (cwd/home/root). See netlify/build packages/cache-utils/src/path.ts.
function localMirrorDir(): string | undefined {
  const dir = join(process.cwd(), '.netlify', 'cache', 'cwd', TEMPLATE_REPO_NAME)
  return existsSync(dir) ? dir : undefined
}

function bailGitHubUnreachable(operation: string): never {
  console.error(
    chalk.red(
      `Could not ${operation} from GitHub and no local ${TEMPLATE_REPO_NAME} mirror is available. ` +
        `GitHub may be experiencing an outage. Please try again in a few minutes.`,
    ),
  )
  process.exit(1)
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
    console.warn(chalk.yellow(`⚠ Could not reach GitHub, using local ${TEMPLATE_REPO_NAME} copy`))
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
  const cacheCwd = join(process.cwd(), '.netlify', 'cache', 'cwd')
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
    console.log(chalk.gray('⟳ Fetching template...'))
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
    console.warn(chalk.yellow(`⚠ Could not clone template repo, using local ${TEMPLATE_REPO_NAME} copy`))

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

  program.action(async (projectName: string | undefined, options: CliOptions) => {
    // Handle --list-addons-json
    if (options.listAddonsJson) {
      const manifest = await loadManifest<{ starters: unknown }>()
      console.log(JSON.stringify(manifest.starters, null, 2))
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
      console.error(chalk.red(error))
      process.exit(1)
    }

    // Delete index.html if it exists in the target directory
    const indexHtmlPath = join(targetDir, 'index.html')
    if (existsSync(indexHtmlPath)) {
      await rm(indexHtmlPath)
    }

    console.log(
      chalk.bold.cyan(
        `Creating a new Netlify TanStack Start app in directory ${chalk.white(targetDir)}...`,
      ),
    )
    console.log(chalk.gray(`Using starter: ${starterId}`))

    // Fetch manifest to resolve frameworkId for this starter
    const manifest = await loadManifest<{ starters: StarterEntry[] }>()
    const githubFrameworkId = manifest.starters.find((s) => s.id === starterId)?.framework

    const { srcDir, frameworkId, cleanup } = await resolveSourceDir(starterId, githubFrameworkId)
    try {
      const starterPath = join(srcDir, 'starters', starterId)
      if (!existsSync(starterPath)) {
        console.error(
          chalk.red(
            `Starter "${starterId}" not found in the template repository. Run --list-addons-json to see available starters.`,
          ),
        )
        process.exit(1)
      }

      // Copy starter files to target directory
      await cp(starterPath, targetDir, { recursive: true })

      // Copy framework overlay files if they exist
      if (frameworkId) {
        const frameworkPath = join(srcDir, 'frameworks', frameworkId)
        if (existsSync(frameworkPath)) {
          console.log(chalk.gray(`⟳ Applying framework overlay (${frameworkId})...`))
          await cp(frameworkPath, targetDir, { recursive: true })
          console.log(chalk.green(`✓ Framework overlay applied (${frameworkId})`))
        } else {
          console.log(chalk.yellow(`⚠ Framework overlay "${frameworkId}" not found in repo, skipping`))
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

      console.log(chalk.green(`✓ Template copied`))
    } finally {
      await cleanup()
    }

    // Initialize git repository
    if (options.git !== false) {
      try {
        execSync('git init', { cwd: targetDir, stdio: 'pipe' })
        console.log(chalk.green('✓ Initialized git repository'))
      } catch {
        console.warn(chalk.yellow('⚠ Could not initialize git repository'))
      }
    }

    // Install dependencies
    if (options.install !== false) {
      const pm =
        options.packageManager ??
        getPackageManagerFromUserAgent() ??
        'pnpm'
      console.log(chalk.gray(`⟳ Installing dependencies with ${pm}...`))
      try {
        let cmd = `${pm} install`
        if (pm === 'npm') {
          cmd += ' --no-audit --no-fund --prefer-offline'
          console.log(chalk.gray(`  ${cmd}`))
        }
        execSync(cmd, { cwd: targetDir, stdio: 'inherit' })
        console.log(chalk.green('✓ Dependencies installed'))
      } catch {
        console.error(
          chalk.red(
            `Failed to install dependencies. Run \`${pm} install\` manually.`,
          ),
        )
      }
    }

    // Symlink .agents → .claude if .claude exists
    const claudeDir = join(targetDir, '.claude')
    if (existsSync(claudeDir)) {
      const agentsDir = join(targetDir, '.agents')
      if (!existsSync(agentsDir)) {
        await symlink('.claude', agentsDir, 'dir')
        console.log(chalk.green('✓ Linked .agents → .claude'))
      }
    }

    console.log(chalk.bold.green('\nDone! Your project is ready.'))
    console.log(chalk.white('\nNext steps:'))
    console.log(chalk.cyan(`  cd ${basename(targetDir)}`))
    if (options.install === false) {
      const pm =
        options.packageManager ??
        getPackageManagerFromUserAgent() ??
        'pnpm'
      console.log(chalk.cyan(`  ${pm} install`))
    }
    console.log(chalk.cyan('  pnpm dev'))
  })

  program.parse()
}
