import { resolve, basename, join } from 'node:path'
import { unlink } from 'node:fs/promises'
import { Command, InvalidArgumentError } from 'commander'
import chalk from 'chalk'
import validatePackageName from 'validate-npm-package-name'

import {
  SUPPORTED_PACKAGE_MANAGERS,
  createApp,
  createDefaultEnvironment,
  finalizeAddOns,
  getAllAddOns,
  getFrameworkByName,
  getPackageManager,
  DEFAULT_PACKAGE_MANAGER,
  populateAddOnOptionsDefaults,
} from '@tanstack/cta-engine'

import type { CliOptions } from './types.js'
import type {
  Options,
  PackageManager,
} from '@tanstack/cta-engine'

// Utility functions
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

// Create environment with UI functions for console output
function createEnvironment(appName: string) {
  const env = createDefaultEnvironment()
  env.appName = appName
  env.intro = (message: string) => console.log(chalk.bold.cyan(message))
  env.outro = (message: string) => console.log(chalk.bold.green(message))
  env.info = (title?: string, message?: string) => {
    if (title && message) {
      console.log(chalk.blue(`${title}: ${message}`))
    } else if (title) {
      console.log(chalk.blue(title))
    }
  }
  env.error = (title?: string, message?: string) => {
    if (title && message) {
      console.error(chalk.red(`${title}: ${message}`))
    } else if (title) {
      console.error(chalk.red(title))
    }
  }
  env.warn = (title?: string, message?: string) => {
    if (title && message) {
      console.warn(chalk.yellow(`${title}: ${message}`))
    } else if (title) {
      console.warn(chalk.yellow(title))
    }
  }
  env.spinner = () => ({
    start: (message: string) => console.log(chalk.gray(`⟳ ${message}`)),
    stop: (message: string) => console.log(chalk.green(`✓ ${message}`)),
  })
  return env
}

export interface CliConfig {
  name: string
  appName: string
  defaultFramework: string
  forcedMode?: string
  forcedAddOns?: Array<string>
}

export function cli({
  name,
  appName,
  defaultFramework,
  forcedMode,
  forcedAddOns = [],
}: CliConfig) {
  const environment = createEnvironment(appName)
  const program = new Command()

  const defaultMode = forcedMode || 'file-router'

  program.name(name).description(`CLI to create a new ${appName} application`)

  program.argument('[project-name]', 'name of the project')

  program
    .option('--no-install', 'skip installing dependencies')
    .option<PackageManager>(
      `--package-manager <${SUPPORTED_PACKAGE_MANAGERS.join('|')}>`,
      `Explicitly tell the CLI to use this package manager`,
      (value) => {
        if (!SUPPORTED_PACKAGE_MANAGERS.includes(value as PackageManager)) {
          throw new InvalidArgumentError(
            `Invalid package manager: ${value}. The following are allowed: ${SUPPORTED_PACKAGE_MANAGERS.join(', ')}`,
          )
        }
        return value as PackageManager
      },
    )
    .option<Array<string> | boolean>(
      '--add-ons [...add-ons]',
      'pick from a list of available add-ons (comma separated list)',
      (value: string) => {
        let addOns: Array<string> | boolean = !!value
        if (typeof value === 'string') {
          addOns = value.split(',').map((addon) => addon.trim())
        }
        return addOns
      },
    )
    .option('--list-add-ons', 'list all available add-ons', false)
    .option('--list-addons-json', 'list all available add-ons as JSON', false)
    .option(
      '--addon-details <addon-id>',
      'show detailed information about a specific add-on',
    )
    .option('--no-git', 'do not create a git repository')
    .option(
      '--target-dir <path>',
      'the target directory for the application root',
    )
    .option(
      '-f, --force',
      'force project creation even if the target directory is not empty',
      false,
    )
    .option(
      '--bare-bones',
      'create minimal scaffolding for LLM modification',
      false,
    )

  program.action(async (projectName: string, options: CliOptions) => {
    const framework = getFrameworkByName(defaultFramework)
    if (!framework) {
      console.error(`Framework '${defaultFramework}' not found`)
      process.exit(1)
    }

    // Handle --list-addons-json
    if (options.listAddonsJson) {
      const addOns = await getAllAddOns(framework, defaultMode)
      const serialized = addOns
        .filter((a) => !forcedAddOns.includes(a.id))
        .map((addon) => ({
          id: addon.id,
          name: addon.name,
          description: addon.description,
          type: addon.type,
          options: addon.options,
        }))
      console.log(JSON.stringify(serialized, null, 2))
      return
    }

    // Handle --list-add-ons (text format)
    if (options.listAddOns) {
      const addOns = await getAllAddOns(framework, defaultMode)
      let hasConfigurableAddOns = false
      for (const addOn of addOns.filter((a) => !forcedAddOns.includes(a.id))) {
        const hasOptions =
          addOn.options && Object.keys(addOn.options).length > 0
        const optionMarker = hasOptions ? '*' : ' '
        if (hasOptions) hasConfigurableAddOns = true
        console.log(
          `${optionMarker} ${chalk.bold(addOn.id)}: ${addOn.description}`,
        )
      }
      if (hasConfigurableAddOns) {
        console.log('\n* = has configuration options')
      }
      return
    }

    // Handle --addon-details
    if (options.addonDetails) {
      const addOns = await getAllAddOns(framework, defaultMode)
      const addOn = addOns.find((a) => a.id === options.addonDetails)
      if (!addOn) {
        console.error(`Add-on '${options.addonDetails}' not found`)
        process.exit(1)
      }

      console.log(
        `${chalk.bold.cyan('Add-on Details:')} ${chalk.bold(addOn.name)}`,
      )
      console.log(`${chalk.bold('ID:')} ${addOn.id}`)
      console.log(`${chalk.bold('Description:')} ${addOn.description}`)
      console.log(`${chalk.bold('Type:')} ${addOn.type}`)
      console.log(`${chalk.bold('Phase:')} ${addOn.phase}`)
      console.log(`${chalk.bold('Supported Modes:')} ${addOn.modes.join(', ')}`)

      if (addOn.dependsOn && addOn.dependsOn.length > 0) {
        console.log(
          `${chalk.bold('Dependencies:')} ${addOn.dependsOn.join(', ')}`,
        )
      }

      if (addOn.options && Object.keys(addOn.options).length > 0) {
        console.log(`\n${chalk.bold.yellow('Configuration Options:')}`)
        for (const [optionName, option] of Object.entries(addOn.options)) {
          if (option && typeof option === 'object' && 'type' in option) {
            const opt = option as { label: string; description?: string; type: string; default: unknown; options?: Array<{ value: string; label: string }> }
            console.log(`  ${chalk.bold(optionName)}:`)
            console.log(`    Label: ${opt.label}`)
            if (opt.description) {
              console.log(`    Description: ${opt.description}`)
            }
            console.log(`    Type: ${opt.type}`)
            console.log(`    Default: ${opt.default}`)
            if (opt.type === 'select' && opt.options) {
              console.log(`    Available values:`)
              for (const choice of opt.options) {
                console.log(`      - ${choice.value}: ${choice.label}`)
              }
            }
          }
        }
      } else {
        console.log(`\n${chalk.gray('No configuration options available')}`)
      }

      if (addOn.routes && addOn.routes.length > 0) {
        console.log(`\n${chalk.bold.green('Routes:')}`)
        for (const route of addOn.routes) {
          console.log(`  ${chalk.bold(route.url)} (${route.name})`)
          console.log(`    File: ${route.path}`)
        }
      }
      return
    }

    // Handle project creation
    if (!projectName) {
      console.error('Project name is required')
      program.help()
      return
    }

    let resolvedProjectName = projectName
    let targetDir: string

    // Handle "." as project name - use current directory
    if (projectName === '.') {
      resolvedProjectName = sanitizePackageName(getCurrentDirectoryName())
      targetDir = resolve(process.cwd())
    } else {
      targetDir = options.targetDir
        ? resolve(options.targetDir)
        : resolve(process.cwd(), projectName)
    }

    const { valid, error } = validateProjectName(resolvedProjectName)
    if (!valid) {
      console.error(error)
      process.exit(1)
    }

    // Determine selected add-ons
    const selectedAddOns = new Set<string>([...forcedAddOns])
    if (options.addOns && Array.isArray(options.addOns)) {
      for (const a of options.addOns) {
        selectedAddOns.add(a)
      }
    }

    const chosenAddOns = await finalizeAddOns(
      framework,
      defaultMode,
      Array.from(selectedAddOns),
    )

    const finalOptions: Options = {
      projectName: resolvedProjectName,
      targetDir,
      framework,
      mode: defaultMode,
      typescript: true,
      tailwind: true,
      packageManager:
        options.packageManager ||
        getPackageManager() ||
        DEFAULT_PACKAGE_MANAGER,
      git: options.git !== false,
      install: options.install !== false,
      chosenAddOns,
      addOnOptions: {
        ...populateAddOnOptionsDefaults(chosenAddOns),
        project: { bareBones: options.bareBones ?? false },
      },
    }

    environment.intro(`Creating a new ${appName} app in ${resolvedProjectName}...`)
    await createApp(environment, finalOptions)

    // Delete files specified in bareBones.deleteFiles for each add-on when in bare-bones mode
    if (options.bareBones) {
      for (const addOn of chosenAddOns) {
        const addOnWithBareBones = addOn as typeof addOn & {
          bareBones?: { deleteFiles?: Array<string> }
        }
        if (addOnWithBareBones.bareBones?.deleteFiles) {
          for (const file of addOnWithBareBones.bareBones.deleteFiles) {
            const filePath = join(targetDir, file)
            try {
              await unlink(filePath)
            } catch {
              // File may not exist, ignore errors
            }
          }
        }
      }
    }
  })

  program.parse()
}
