# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The Android `versionCode` is managed by EAS (`appVersionSource: remote`), so it
is not tracked here. Versions below refer to the `version` field in
`package.json` and to the matching `v*` git tags.

## [Unreleased]

### Added

- Student login by phone number, replacing email in the sign up flow.
- `image_association` activity type.
- Open source project documentation: `LICENSE` (Apache 2.0), `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md`, GitHub issue and pull request templates,
  and this changelog. The `README.md` was rewritten to document the real stack,
  setup, environment variables, EAS builds, offline mode and i18n.
- `license: "Apache-2.0"` declared in `package.json`.

### Changed

- Dependencies aligned with Expo SDK 56.
- UX polish on the activity screens, the course detail screen and the home
  screen.
- Text reading activity scrolling fixed.
- Default API base URL in `.env.example` now points at
  `https://api-educado.tominho.com`.

### Fixed

- Network drop and poor connectivity handling in the lesson video players.
- Empty Microsoft Clarity recordings on Android, caused by late initialization.
- `usePeriodicSync` typing: use `ReturnType<typeof setInterval>` instead of a
  Node specific type.

### Security

- Dependency bumps: `postcss`, `expo`, `shell-quote`, `@babel/core`, `js-yaml`,
  `react-native`.

### Known issues

- `app.config.ts` still declares `version: '1.0.1'` while `package.json` is at
  `1.0.2`. The two should be reconciled in the next release.
- Builds produced before the API migration point at the retired Coolify
  hostname `https://igg084s4s08sk0w08gsc0cgk.tominho.com`, which now answers
  503. Because `EXPO_PUBLIC_API_URL` is inlined at build time, those builds need
  to be rebuilt on EAS against `https://api-educado.tominho.com`.

## [1.0.2] - 2026-05-04

### Changed

- Mobile course flow aligned with the Figma design.

### Removed

- Legacy section route file.

## [1.0.1] - 2026-05-02

### Fixed

- Web compatibility: authentication, logout, video streaming and card layout.
- Duplicate email feedback on registration (HTTP 409) and the post login
  redirect.
- True/false answer coercion, authenticated video streaming and secure storage.
- Environment handling in the deployment build.

### Security

- Dependency bumps: `undici`, `tar`, `minimatch`, `@isaacs/brace-expansion`.
- `credentials.json` and `credentials/` added to `.gitignore` so the signing
  keystore is never committed.

## [1.0.0] - 2026-03-23

### Added

- First release of the Educado Android app: course catalog, enrollment, video
  lessons with interleaved activities, progress tracking, gamification with
  points and badges, leaderboard, certificates, and full course download for
  offline use.
- Internationalization with Portuguese (pt-BR, default) and English.

[Unreleased]: https://github.com/ErasmusEgalitarian/educado-app/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/ErasmusEgalitarian/educado-app/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/ErasmusEgalitarian/educado-app/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ErasmusEgalitarian/educado-app/releases/tag/v1.0.0
