# Valora Hooks

[![GitHub License](https://img.shields.io/github/license/valora-inc/hooks?color=blue)](https://github.com/valora-inc/hooks/blob/main/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/valora-inc/hooks/.github/workflows/workflow.yaml?branch=main)](https://github.com/valora-inc/hooks/actions/workflows/workflow.yaml?query=branch%3Amain)
[![Codecov](https://img.shields.io/codecov/c/github/valora-inc/hooks)](https://codecov.io/gh/valora-inc/hooks)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/valora-inc/hooks#contributing)

Valora Hooks allows developers to extend Valora's functionality by writing short programs called "hooks". These hooks are called in response to certain in-app or blockchain events and are used to provide Valora with additional information and features.

Check out the [Valora Hooks documentation](https://docs.staging.valora.xyz/hooks/overview) for more information.

Currently, this repository contains position pricing and shortcut hooks.

> [!WARNING]
> It is an experimental feature and is not fully supported yet.

## Developing Hooks

To develop hooks, you will need to have Node.js installed on your computer.

### Setup

1. Clone this repository to your local machine.
2. Run `yarn install` to install the necessary dependencies.

### Position Pricing

See the [documentation](docs/types/position.md) for developing position pricing hooks.

### Shortcuts

See the [documentation](docs/types/shortcut.md) for developing shortcut hooks.

## Contributing

Do you have ideas for more types of hooks that would be useful for Valora users?
Please reach out to us on [Discord](https://discord.com/invite/J5XMtMkwC4).

<!-- TODO If you'd like to contribute to this repository, please follow the [Contributing Guidelines](CONTRIBUTING.md).-->

We welcome bug reports, feature requests, and code contributions.
