import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'

import { schemaTypes } from './sanity/schemaTypes'
import structure from './sanity/structure'

// Project id comes from env; the fake fallback keeps the build compiling when the
// env is unset (the Studio only works once a real project id is provided).
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder-project-id'
export const dataset = process.env.SANITY_DATASET || 'production'
export const apiVersion = '2025-01-01'

export default defineConfig({
  name: 'jv-ventures',
  title: 'JV Ventures',
  basePath: '/studio',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
  schema: {
    types: schemaTypes,
  },
})
