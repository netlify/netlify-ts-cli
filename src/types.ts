export interface CliOptions {
  install: boolean
  packageManager: string | undefined
  addOns: string | boolean | undefined
  listAddonsJson: boolean
  git: boolean
  targetDir: string | undefined
}
