## Description

<!-- What this pull request changes, and why. -->

Related issue: <!-- Closes #000 -->

## Type of change

- [ ] `feat` new feature
- [ ] `fix` bug fix
- [ ] `refactor` no behavior change
- [ ] `docs` documentation only
- [ ] `chore` / `build` / `ci` tooling or dependencies
- [ ] Breaking change

## How it was tested

<!-- Be specific: device or emulator, Android version, build type, and the flow
     you walked through. -->

| Field | Value |
| ----- | ----- |
| Device or emulator | |
| Android version | |
| Build type | <!-- dev client, `npm run android`, EAS preview --> |
| API used | <!-- e.g. https://api-educado.tominho.com or local --> |

Scenarios covered:

- [ ] Online, normal connection
- [ ] Offline or unstable connection, if the change touches content or media
- [ ] Both languages (pt-BR and en), if the change touches the UI

## Quality gate

- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] No new `any` introduced to silence the compiler

## Internationalization

- [ ] No hardcoded user facing string: all text goes through `t('key')`
- [ ] New keys were added to **both** `locales/pt-BR.json` and `locales/en.json`
- [ ] Not applicable (no UI text touched)

## Impact

- [ ] Requires a native rebuild (`app.config.ts`, `plugins/`, native module)
- [ ] Adds or updates a dependency (justified in the description, installed with
      `npx expo install` when applicable)
- [ ] Changes an environment variable (`.env.example` and README updated)
- [ ] Affects authentication, secure storage or personal data
- [ ] Affects the offline download or progress sync flow
- [ ] Needs a matching change in `educado-api` (linked below)

## Screenshots or recording

<!-- Required for any visible UI change. Before and after if it is a fix. -->

## Checklist

- [ ] Branch created from `dev` and targeting the right branch
- [ ] Commits follow Conventional Commits
- [ ] The pull request is focused on one concern
- [ ] No secret, token, keystore or `.env` file committed
- [ ] Documentation updated if the change affects setup or behavior
- [ ] Reviewed by at least one other contributor before merge
