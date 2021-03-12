# :arrow_up: package.json Version Bump :arrow_up:

<p align="center">Bumps <code>version</code> in package.json based on labels added to the PR</p>

---

Forked from https://github.com/copapow/version-bump-package

## Usage :computer:

:exclamation: *Hey!* This action requires `actions/checkout@v2`

```yaml
# checkout step is prerequisite
- uses: actions/checkout@v2
- uses: finnoconsult/github-actions-package-bump-version@v1
    id: bump
    with:
        major_pattern: '^major/' # optional - default = ^major
        minor_pattern: '^feat/' # optional - default = ^feat
        patch_pattern: '^fix/' # optional - default = ^fix
        source: title       # optional - default = title
        default_branch: remotes/origin/master       # optional - default = remotes/origin/master
        package_json_path: package.json       # optional - default = package.json
        previous_version:        # optional - default =
        github_token: ${{ secrets.GITHUB_TOKEN }} # required
- run: |
    echo "Previous version: ${{ steps.bump.outputs.previous_version }}"
    echo "New Version: ${{ steps.bump.outputs.new_version }}"
```

## But Why?

With input param 'source' it can operate with PR labels, and also PR.

The action doesn't do any commit by itself, it also requires a subsequent commit action, not to loose the updated package.json
See .github/workdlows/approve-pr.yml in this repo, to see how I use this action with commit to auto commit the new version to package.json. That bypasses the caveat with [GitHub's protected branch features](https://docs.github.com/en/github/administering-a-repository/about-protected-branches), and uses auto-merge after approvals.
