# :arrow_up: package.json Version Bump :arrow_up:

<p align="center">Bumps <code>version</code> in package.json based on labels added to the PR</p>

---

TODO: comment about forked from https://github.com/copapow/version-bump-package

## Usage :computer:

:exclamation: *Hey!* This action requires `actions/checkout@v2`

```yaml
# checkout step is prerequisite
- uses: actions/checkout@v2
- uses: finnoconsult/github-actions-package-bump-version@v1
    id: bump
    with:
        major_label: version-major # optional - default = major
        minor_label: version-minor # optional - default = minor
        patch_label: version-patch # optional - default = patch
        default_branch: main       # optional = default = master
        github_token: ${{ secrets.GITHUB_TOKEN }} # required
- run: |
    echo "Previous version: ${{ steps.bump.outputs.previous_version }}"
    echo "New Version: ${{ steps.bump.outputs.new_version }}"
```

## Inputs :inbox_tray:


|Key|Required|Description|Default|
|:-:|:-:|-|:-:|
|`major_label`  | No  | Custom label to trigger major version bump      | major |
|`minor_label`  | No  | Custom label to trigger minor version bump      | minor |
|`patch_label`  | No  | Custom label to trigger patch version bump      | patch |
|`default_branch`  | No  | Default branch of your project  | master |
|`github_token` | Yes | Github token - can be `${{secrets.GITHUB_TOKEN}}` |

## Outputs :outbox_tray:

|Key|Description|
|:-:|-|
|`previous_version`  | `version` in package.json _before_ bump  |
|`new_version`  | `version` in package.json _after_ bump  |

## But Why?

There are many actions like this one, but this one is mine. Similar actions utilize specific terms in commit messages and while that may work for some, I prefer to use labels.

TODO
Here's how I use this action in conjunction with `EndBug/add-and-commit@v7` to auto commit the new version to package.json. A caveat with using `EndBug/add-and-commit` is it can't be used if you use [GitHub's protected branch features](https://docs.github.com/en/github/administering-a-repository/about-protected-branches).

```yaml
name: Bump Package Version On Merge

on:
  pull_request_review:
    branches:
      - master

jobs:
  bump-package-version:
    # Only run if the PR review is approved
    if: github.event.review.state == 'approved'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          ref: 'refs/heads/master'
      - uses: nyaa8/package-version@v1
        with:
          path: 'finnoconsult.at/package.json'
      - uses: actions/checkout@v2
      - uses: finnoconsult/github-actions-package-bump-version@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          previous_version: ${{env.PACKAGE_VERSION}}
      - uses: EndBug/add-and-commit@v7
        with:
          branch: main
          message: 'Bump package version'
```
