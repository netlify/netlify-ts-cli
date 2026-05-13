export interface CliOptions {
  install: boolean
  packageManager: string | undefined
  addOns: string | boolean | undefined
  listAddonsJson: boolean
  git: boolean
  targetDir: string | undefined
  json: boolean
}

export interface ProjectSummary {
  schemaVersion: 1
  targetDir: string
  projectName: string
  starter: { id: string; framework?: string }
  git: { initialized: boolean }
  packageManager: string
  install: { ran: boolean; command?: string }
  packageJson?: {
    path: string
    name?: string
    scripts: Record<string, string>
    dependencies: string[]
    devDependencies: string[]
  }
  agentInstructions: string[]
  files: string[]
  nextSteps: {
    cd: string
    commands: { label: string; command: string }[]
  }
}
