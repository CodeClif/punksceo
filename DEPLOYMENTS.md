# Punks CEO / CIG deployment reference

This file documents the main CIG deployment addresses that are referenced across the repository.

## Ethereum mainnet

| Component | Address | Notes |
| --- | --- | --- |
| CIG v2 (current) | `0xCB56b52316041A62B6b5D0583DcE4A8AE7a3C629` | Current Cigarette Token deployment. The repository's rescue contract also references this address as `cig`. |
| Legacy CIG | `0x5A35A6686db167B05E2Eb74e1ede9fb5D9Cdb3E0` | Previous CIG deployment. The rescue contract references this address as `old cig`. |

## Source branches

| Branch | Purpose |
| --- | --- |
| `v2-currently-deployed` | Source matching the currently deployed v2 CIG contract. |
| `main` | Later development, including the v2.1 withdrawal fix and additional project contracts. |
| `old-cigtoken-deployed-contract` | Historical source for the original deployed CIG contract. |

When adding documentation, integrations, or tooling, prefer the v2 address above unless you are explicitly working with the legacy migration/rescue flow.
