import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder-project-id'
const dataset = process.env.SANITY_DATASET || 'production'

export default defineCliConfig({
  api: { projectId, dataset },
})
