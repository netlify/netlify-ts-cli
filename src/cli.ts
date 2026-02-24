import { resolve, basename } from 'node:path'
import { existsSync, readdirSync } from 'node:fs'
import { cp, rm, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { Command } from 'commander'
import chalk from 'chalk'
import validatePackageName from 'validate-npm-package-name'

import type { CliOptions } from './types.js'

const GITHUB_REPO = 'https://github.com/netlify/swar-templates.git'
const MANIFEST_URL =
  'https://raw.githubusercontent.com/netlify/swar-templates/main/manifest.json'

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
    .option(
      '-f, --force',
      'force project creation even if the target directory is not empty',
    )

  program.action(async (projectName: string | undefined, options: CliOptions) => {
    // Handle --list-addons-json
    if (options.listAddonsJson) {
      const manifest = await fetch(MANIFEST_URL).then((r) => r.json()) as { starters: unknown }
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

    // Check if target directory exists and is non-empty
    if (existsSync(targetDir)) {
      const contents = readdirSync(targetDir)
      if (contents.length > 0 && !options.force) {
        console.error(
          chalk.red(
            `Target directory "${targetDir}" is not empty. Use --force to overwrite.`,
          ),
        )
        process.exit(1)
      }
    }

    // Delete index.html if it exists in the target directory
    const indexHtmlPath = join(targetDir, 'index.html')
    if (existsSync(indexHtmlPath)) {
      await rm(indexHtmlPath)
    }

    console.log(
      chalk.bold.cyan(
        `Creating a new Netlify TanStack Start app in ${chalk.white(targetDir)}...`,
      ),
    )
    console.log(chalk.gray(`Using starter: ${starterId}`))

    // Fetch manifest to resolve frameworkId for this starter
    type StarterEntry = { id: string; framework?: string }
    const manifest = await fetch(MANIFEST_URL).then((r) => r.json()) as { starters: StarterEntry[] }
    const starterEntry = manifest.starters.find((s) => s.id === starterId)
    const frameworkId = starterEntry?.framework

    // Sparse clone the template repo into a temp directory
    const tmpDir = await mkdtemp(join(tmpdir(), 'netlify-cta-'))
    try {
      console.log(chalk.gray('⟳ Fetching template...'))
      const sparsePaths = [`starters/${starterId}`, ...(frameworkId ? [`frameworks/${frameworkId}`] : [])]
      execSync(
        `git clone --depth=1 --filter=blob:none --sparse ${GITHUB_REPO} ${tmpDir}`,
        { stdio: 'pipe' },
      )
      execSync(
        `git -C ${tmpDir} sparse-checkout set ${sparsePaths.join(' ')}`,
        { stdio: 'pipe' },
      )

      const starterPath = join(tmpDir, 'starters', starterId)
      if (!existsSync(starterPath)) {
        console.error(
          chalk.red(
            `Starter "${starterId}" not found in the template repo. Run --list-addons-json to see available starters.`,
          ),
        )
        process.exit(1)
      }

      // Copy starter files to target directory
      await cp(starterPath, targetDir, { recursive: true })

      // Copy framework overlay files if they exist
      if (frameworkId) {
        const frameworkPath = join(tmpDir, 'frameworks', frameworkId)
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
      await rm(tmpDir, { recursive: true, force: true })
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
        execSync(`${pm} install`, { cwd: targetDir, stdio: 'inherit' })
        console.log(chalk.green('✓ Dependencies installed'))
      } catch {
        console.error(
          chalk.red(
            `Failed to install dependencies. Run \`${pm} install\` manually.`,
          ),
        )
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
