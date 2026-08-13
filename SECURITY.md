# Security Policy

Educado is an educational platform for waste pickers in Brazil, run as a
partnership between the University of Brasilia (UnB) and Aalborg University.
This repository is the Android mobile app. It authenticates students, stores a
session token on the device and downloads course content for offline use, so we
take security reports seriously.

## Supported Versions

Only the current release line receives security updates. Older builds are not
patched: upgrade to the latest `1.0.x`.

| Version | Supported |
| ------- | --------- |
| 1.0.x   | Yes       |
| < 1.0   | No        |

The app talks to the production API at https://api-educado.tominho.com.

## Reporting a Vulnerability

Do not open a public GitHub issue, pull request or discussion for a security
vulnerability.

Report it privately by email to **190091681@aluno.unb.br**. If you prefer, you
can also use GitHub's private vulnerability reporting on this repository
(Security tab, "Report a vulnerability").

Please include, as far as you can:

- A description of the vulnerability and its impact.
- The affected screen, file or component.
- Steps to reproduce, ideally with a minimal case.
- The app version, commit hash or build (EAS build id) you tested against, plus
  the device model and Android version.
- Any logs, screenshots or proof of concept you have.
- How you would like to be credited, if you want credit.

## What to expect

| Stage | Target |
| ----- | ------ |
| Acknowledgement of your report | within 5 business days |
| Initial assessment and severity triage | within 10 business days |
| Progress updates | every 15 days while the issue is open |
| Fix for a critical or high severity issue | within 30 days of triage |
| Fix for medium or low severity | scheduled into the normal release flow |

Note that shipping a fix to users requires a new build and a store release, so
the user facing timeline can be longer than the code fix timeline.

If we accept the report, we will work on a fix, keep you updated, and credit you
in the release notes unless you ask us not to. If we decline it, we will explain
why. Please keep the details private until a fix is released.

This is an academic project maintained by students and researchers, so response
times can stretch during exam periods and university holidays. We will tell you
if that happens.

## Scope

In scope:

- The source code in this repository: authentication and session handling, token
  storage (`expo-secure-store`), local data in AsyncStorage, the offline
  download manager and the files it writes to the app sandbox, media loading,
  progress synchronization, deep links through the `educado` scheme, and the
  Android security config in `plugins/withAndroidSecurity.js`.
- The published Android application package (`com.educado2.app`).
- Secrets, credentials, keystores or personal data accidentally committed to
  this repository.

Out of scope:

- The backend API. Report those to the `educado-api` repository, which has its
  own security policy, or to the same email address.
- Denial of service, volumetric or brute force load testing against the
  production API.
- Social engineering, phishing or physical attacks against contributors or
  university staff.
- Attacks that require a rooted device, a physical device already unlocked and
  in the attacker's hands, or a malicious build the user installed themselves.
- The fact that `EXPO_PUBLIC_API_URL` is visible in the bundle. It is a public
  build time value by design and holds no secret.
- Vulnerabilities in third party dependencies that already have a public
  advisory and an open Dependabot pull request here. Report those upstream
  instead.
- Reports produced only by an automated scanner, with no demonstrated impact.
- Missing hardening or best practice suggestions with no exploitable impact.
  These are welcome, but as a normal issue, not as a vulnerability report.
- Third party services we do not operate (Microsoft Clarity, Expo/EAS, Google
  Play, the hosting provider). Report those to the vendor.

## Testing guidelines

If you test against the production API, use accounts you created yourself, do
not access or modify data belonging to other users, do not run destructive
operations, and stop as soon as you have confirmed the issue. Do not exfiltrate
personal data: a count or a redacted sample is enough to prove impact.
