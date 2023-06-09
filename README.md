# Game Input

Gamedev controls.

## Tools

- [changelogithub]
  - This generates a changelog for a github release using [Conventional Commits].
- [bumpp]
  - Interactive version prompt.

## How to Work

- Develop like normal using [Conventional Commits].
- When you're ready to push a tag, run `bumpp`.
  - This will walk you through releasing a `tag`.
- When you're ready to publish, create a github release and the workflow will take over.
  - This will use [changelogithub] to generate a changelog and publish to NPM.

[bumpp]: https://www.npmjs.com/package/bumpp
[changelogithub]: https://github.com/antfu/changelogithub
[conventional commits]: https://www.conventionalcommits.org/en/v1.0.0/

## Kudos

- [Contro](https://www.npmjs.com/package/contro)