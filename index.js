import * as core from '@actions/core'
import * as github from '@actions/github'
import * as semver from 'semver'
import path from 'path'
import fs from 'fs'

const workspace = process.env.GITHUB_WORKSPACE

const getPR = async () => {
  try {
    const token = core.getInput('github_token', {required: true})
    const octokit = new github.getOctokit(token)
    const context = github.context

    console.log('get pr', {
      owner: context.issue.owner,
      repo: context.issue.repo,
      pull_number: context.issue.number
    });

    const { data: pr } = await octokit.pulls.get({
      owner: context.issue.owner,
      repo: context.issue.repo,
      pull_number: context.issue.number
    });
    core.debug(`got pr data`);
    core.debug(`pr title ${pr.title}`);
    console.log('pr title', pr.title);
    core.debug(`pr data ${JSON.stringify(pr)}`);
    core.debug(`pr data ${JSON.stringify(pr)}`);

    console.log('returning pr data');
    return pr;
  } catch (error) {
    console.log()
    core.setFailed(`Could not retrieve labels: ${error}`)
    return {}
  }
}

const getPRLabels = async () => {
  try {
    const pr = getPR();
    console.log('getPRLabels', pr.labels);
    return pr.labels.map(label => label.name);
  } catch (error) {
    console.log()
    core.setFailed(`Could not retrieve labels: ${error}`)
    return []
  }
}

async function run() {
  try {

    const previousVersion = core.getInput('previous_version')

    const validMajorLabel = core.getInput('major_pattern')
    const validMinorLabel = core.getInput('minor_pattern')
    const validPatchLabel = core.getInput('patch_pattern')

    const pathToPackage = core.getInput('package_json_path') || path.join(workspace, 'package.json')

    core.debug(`Valid labels are: ${validMajorLabel}, ${validMinorLabel}, ${validPatchLabel}`)

    const inputMappedToVersion = {
      [validMajorLabel]: 'major',
      [validMinorLabel]: 'minor',
      [validPatchLabel]: 'patch'
    }

    const prLabels = await getPRLabels()
    console.log(`prLabels: ${prLabels.join(',')}`)
    core.debug(`prLabels: ${prLabels.join(',')}`)
    const versionLabelsOnPR = Object.keys(inputMappedToVersion).filter(
      validLabel => prLabels.includes(validLabel)
    )

    if (!versionLabelsOnPR.length) {
      core.setFailed('No valid version labels on PR')
      return
    }

    if (versionLabelsOnPR.length > 1) {
      core.warning(`More than one version label found on PR. Using ${versionLabelsOnPR[0]}`)
    }

    const releaseType = inputMappedToVersion[versionLabelsOnPR[0]]

    core.debug(`Release type: ${releaseType}`)

    const newVersion = semver.inc(previousVersion, releaseType)
    core.debug(`Bumping ${previousVersion} to ${newVersion}`)

    packageJSON.version = newVersion

    try {
      fs.writeFileSync(pathToPackage, JSON.stringify(packageJSON, null, 2))
    } catch (error) {
      core.setFailed(`Error writing package.json: ${error.message}`)
      return
    }

    core.setOutput('previous_version', previousVersion)
    core.setOutput('new_version', newVersion)

  } catch (error) {
    core.setFailed(error);
  }
}

run();
