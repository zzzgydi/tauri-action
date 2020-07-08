import * as core from '@actions/core'
import { GitHub, context } from '@actions/github'
import fs from 'fs'

interface Release {
  id: number,
  uploadUrl: string,
  htmlUrl: string
}

export default async function createRelease(tagName: string, releaseName: string, body?: string, commitish?: string, draft = true, prerelease = true): Promise<Release> {
  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error('GITHUB_TOKEN is required')
  }

  // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
  const github = new GitHub(process.env.GITHUB_TOKEN)

  // Get owner and repo from context of payload that triggered the action
  const { owner, repo } = context.repo

  const bodyPath = core.getInput('body_path', { required: false })
  let bodyFileContent = null
  if (bodyPath !== '' && !!bodyPath) {
    try {
      bodyFileContent = fs.readFileSync(bodyPath, { encoding: 'utf8' })
    } catch (error) {
      core.setFailed(error.message)
    }
  }

  // Create a release
  // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
  // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
  const createReleaseResponse = await github.repos.createRelease({
    owner,
    repo,
    tag_name: tagName,
    name: releaseName,
    body: bodyFileContent || body,
    draft,
    prerelease,
    target_commitish: commitish || context.sha
  })

  // Get the ID, html_url, and upload URL for the created Release from the response
  const {
    data: { id, html_url: htmlUrl, upload_url: uploadUrl }
  } = createReleaseResponse

  return {
    id,
    htmlUrl,
    uploadUrl
  }
}