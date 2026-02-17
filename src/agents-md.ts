import { dirname, join, relative } from 'node:path'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const PLACEHOLDER = '[[[DIRECTORY STRUCTURE]]]'

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'dist-ssr',
  '.netlify',
  '.tanstack',
  '.DS_Store',
])

type FileDescriptions = Record<string, string>

function buildDescriptionLookup(descriptions: FileDescriptions): Map<string, string> {
  const lookup = new Map<string, string>()
  for (const [key, desc] of Object.entries(descriptions)) {
    const normalizedKey = key.replace(/\\/g, '/')
    lookup.set(normalizedKey, desc)
    if (normalizedKey.endsWith('.ejs')) {
      lookup.set(normalizedKey.slice(0, -4), desc)
    }
    if (normalizedKey.startsWith('_dot_')) {
      lookup.set('.' + normalizedKey.slice(5), desc)
    }
  }
  return lookup
}

async function loadFileDescriptions(
  addOnDescriptions?: Array<{ packageFileDescriptions?: FileDescriptions }>,
): Promise<Map<string, string>> {
  const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)))
  const infoPath = join(packageRoot, 'project', 'info.json')
  const lookup = new Map<string, string>()

  try {
    const info = await readFile(infoPath, 'utf-8')
    const { packageFileDescriptions } = JSON.parse(info) as {
      packageFileDescriptions?: FileDescriptions
    }
    if (packageFileDescriptions) {
      for (const [key, desc] of buildDescriptionLookup(
        packageFileDescriptions,
      )) {
        lookup.set(key, desc)
      }
    }
  } catch {
    // No info.json or invalid, continue
  }

  if (addOnDescriptions) {
    for (const addOn of addOnDescriptions) {
      if (addOn.packageFileDescriptions) {
        for (const [key, desc] of buildDescriptionLookup(
          addOn.packageFileDescriptions,
        )) {
          lookup.set(key, desc)
        }
      }
    }
  }

  return lookup
}

async function buildFileTree(
  dirPath: string,
  rootPath: string,
  descriptions: Map<string, string>,
  prefix = '',
): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true })
  const filtered = entries
    .filter((e) => !e.name.startsWith('.') || e.name === '.gitignore')
    .filter((e) => !IGNORED_DIRS.has(e.name))
    .sort((a, b) => {
      // Directories first, then files; alphabetically within each
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })

  const lines: string[] = []
  for (let i = 0; i < filtered.length; i++) {
    const entry = filtered[i]
    const isLastEntry = i === filtered.length - 1
    const connector = isLastEntry ? '└── ' : '├── '
    const fullPath = join(dirPath, entry.name)
    const relPath = relative(rootPath, fullPath).replace(/\\/g, '/')
    const description = descriptions.get(relPath)
    const suffix = description ? `  # ${description}` : ''
    lines.push(`${prefix}${connector}${entry.name}${suffix}`)

    if (entry.isDirectory()) {
      const childPrefix = prefix + (isLastEntry ? '    ' : '│   ')
      const childLines = await buildFileTree(
        join(dirPath, entry.name),
        rootPath,
        descriptions,
        childPrefix,
      )
      lines.push(...childLines)
    }
  }
  return lines
}

export async function generateAgentsMd(
  targetDir: string,
  _projectName: string,
  chosenAddOns?: Array<{ packageFileDescriptions?: FileDescriptions }>,
): Promise<void> {
  const agentsMdPath = join(targetDir, 'AGENTS.md')
  let content: string
  try {
    content = await readFile(agentsMdPath, 'utf-8')
  } catch {
    // No AGENTS.md template, skip
    return
  }

  if (!content.includes(PLACEHOLDER)) {
    return
  }

  const descriptions = await loadFileDescriptions(chosenAddOns)
  const treeLines = await buildFileTree(targetDir, targetDir, descriptions)
  const tree = treeLines.length > 0 ? treeLines.join('\n') : '(empty)'

  const updatedContent = content.replace(PLACEHOLDER, tree)
  await writeFile(agentsMdPath, updatedContent, 'utf-8')
}
