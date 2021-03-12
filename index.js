import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import * as semver from 'semver'
import path from 'path'
import fs from 'fs'

const workspace = process.env.GITHUB_WORKSPACE

const token = core.getInput('github_token', {required: true});
const octokit = new github.getOctokit(token);
const context = github.context;
const prInfo = {
  owner: context.issue.owner,
  repo: context.issue.repo,
  pull_number: context.issue.number
};

const getPR = async () => {
  try {
    const { data: pr } = await octokit.pulls.get(prInfo);
    core.info(`pr meta: ${pr.number} ${pr.state}: ${pr.title}|${pr.body}`);
    core.debug(`pr labels: ${JSON.stringify(pr.labels)}`);
    core.debug(`pr commits: ${JSON.stringify(pr.comments)}`);
    // NOTE: these seems to be empty every time
    core.debug(`pr requested_reviewers ${JSON.stringify(pr.requested_reviewers)}`);
    core.debug(`pr assignees ${JSON.stringify(pr.assignees)}`);

    return pr;
  } catch (error) {
    core.setFailed(`Could not retrieve pr: ${error}`)
    return {}
  }
}

// const getPRCommits = async() => {
//   const commits = await octokit.pulls.listCommits(prInfo);
//   return commits;
// }

const validateCommandResults = ({output, error}) => {
  if (error !== '') {
    core.setFailed(`Error getting command: ${error}`)
  }

  if (output === '') {
    core.setFailed('Error: response is empty')
  }

  return output
}


const execCommand = async (command, args, callback) => {

  let output = ''
  let error = ''

  const options = {}
  options.listeners = {
    stdout: (data) => {
      output += data.toString()
    },
    stderr: (data) => {
      error += data.toString()
    }
  }

  await exec.exec(command, args, options)

  return callback(validateCommandResults({output, error}))
}

const getPackageJSONContent = async (pathToPackage) => {
  const defaultBranch = core.getInput('default_branch') || 'remotes/origin/master';
  const content = await execCommand('git', ['show', `${defaultBranch}:${pathToPackage}`], JSON.parse);
  return content;
}

const getSource = async (source) => {
  const pr = await getPR();
  switch(source) {
  case 'label':
    return pr.labels.map(label => label.name);
  case 'title':
  default:
    return [pr.title];
  }
}


export const parseRegex = (regexString) => {
  const match = regexString.match(new RegExp('^/(.*?)/([gimy]*)$'));
  if (match) return new RegExp(match[1], match[2]);
  return new RegExp(regexString);
}

export const matchString = (source, regexString) => {
  const regex = parseRegex(regexString);
  return source.match(regex);
}


export const getBumpTypes = (sourceArray, bumpTypes) => {
  core.debug(`Valid bumps are: ${JSON.stringify(bumpTypes)}`)

  return Object.entries(bumpTypes)
    .filter(([, regex]) => sourceArray.find(source =>matchString(source,regex)))
    .map(([type]) => type);
}

async function run() {
  try {
    // input
    const previousVersionInput = core.getInput('previous_version');

    const pathToPackage = core.getInput('package_json_path') || path.join(workspace, 'package.json')

    const source = core.getInput('source');

    const inputMappedToVersion = {
      major: core.getInput('major_pattern') || '^major',
      minor: core.getInput('minor_pattern') || '^feat',
      patch: core.getInput('patch_pattern') || '^fix',
    }

    // config
    await exec.exec('git', ['fetch', `--all`]);

    const packageJSON = await getPackageJSONContent(pathToPackage);
    core.debug(`package.json ${JSON.stringify(packageJSON)}`)
    const previousVersion = previousVersionInput || packageJSON.version;

    const textArray = await getSource(source);
    core.debug(`checking version against ${source}: ${JSON.stringify(textArray)}`)

    const bumpTypes = getBumpTypes(textArray, inputMappedToVersion);

    // action
    if (!bumpTypes.length) {
      core.setFailed('Nothing found triggering bump')
      return
    }

    if (bumpTypes.length > 1) {
      core.warning(`More than one version label found on PR. Using ${bumpTypes[0]}`)
    }

    const releaseType = bumpTypes[0];

    core.debug(`Release type: ${releaseType}`)

    const newVersion = semver.inc(previousVersion, releaseType)
    core.debug(`Bumping ${previousVersion} to ${newVersion}`)


    try {
      packageJSON.version = newVersion
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
