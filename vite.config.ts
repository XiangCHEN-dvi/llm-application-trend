import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Project Pages: https://<user>.github.io/llm-application-trend/ */
const repoName = process.env.VITE_REPO_NAME ?? 'llm-application-trend'
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const base =
  isGitHubPages && repoName ? `/${repoName}/` : isGitHubPages ? '/' : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
