# API Contracts

`docs/api-contracts/openapi.json` is the checked-in API contract synced from `maru-api`.

## Refresh

Whenever the API surface changes in `maru-api`, refresh the checked-in contract in this repository:

```bash
yarn api-contract:sync
```

## Workflow

1. Pull the latest `maru-api` changes on `dev`.
2. Run `yarn api-contract:sync`.
3. Review the `docs/api-contracts` diff.
4. Commit the frontend change and updated contract files together when contract drift is part of the work.
