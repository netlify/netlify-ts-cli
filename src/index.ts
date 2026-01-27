#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  registerFramework,
  scanAddOnDirectories,
  scanProjectDirectory,
} from '@tanstack/cta-engine'
import { cli } from './cli.js'

const projectDirectory = join(
  dirname(dirname(fileURLToPath(import.meta.url))),
  'project',
)

const addOns = scanAddOnDirectories([
  join(dirname(dirname(fileURLToPath(import.meta.url))), 'add-ons'),
  join(dirname(dirname(fileURLToPath(import.meta.url))), 'examples'),
])

const { files, basePackageJSON, optionalPackages } = scanProjectDirectory(
  projectDirectory,
  join(dirname(dirname(fileURLToPath(import.meta.url))), 'project', 'base'),
)

registerFramework({
  id: 'netlify-start',
  name: 'Netlify TanStack Start',
  description: 'TanStack Start applications for Netlify deployment',
  version: '0.1.0',
  base: files,
  addOns,
  basePackageJSON,
  optionalPackages,
  supportedModes: {
    'file-router': {
      displayName: 'File Router',
      description: 'File-based routing with TanStack Start',
      forceTypescript: true,
    },
  },
})

cli({
  name: 'netlify-cta',
  appName: 'Netlify TanStack Start',
  defaultFramework: 'Netlify TanStack Start',
})
