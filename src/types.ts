import type { PackageManager } from '@tanstack/cta-engine'

export interface CliOptions {
  projectName?: string
  packageManager?: PackageManager
  git?: boolean
  addOns?: Array<string> | boolean
  listAddOns?: boolean
  listAddonsJson?: boolean
  addonDetails?: string
  targetDir?: string
  install?: boolean
  force?: boolean
  bareBones?: boolean
}
