# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |
| Earlier prototypes | No |

Security fixes are prepared on the current `main` branch and included in the
next supported release.

## Report a vulnerability

Use GitHub's **Security → Report a vulnerability** form for this repository.
Do not include exploit details, credentials, personal information or sensitive
WCC material in a public issue.

If private vulnerability reporting is unavailable, contact the repository
owner through their GitHub profile and ask for a private reporting channel.
Include the affected version, impact, reproduction steps and any suggested
mitigation. Maintainers aim to acknowledge a report within three working days
and provide an initial triage within seven working days. These are response
targets, not service-level guarantees.

## Scope

Reports about this repository's code, API handlers, dependency configuration,
deployment headers and handling of operator data are in scope.

The following are not security vulnerabilities in this project:

- emergency reports or requests for operational assistance;
- third-party feed outages, licence disputes or source-data inaccuracies;
- incorrect conclusions produced by Mock, retrospective or incomplete data;
- missing access to WCC systems that this public demo does not claim to have.

For an immediate emergency, use the official New Zealand emergency channels.
This prototype is not an emergency-reporting service.

## Disclosure and data handling

Allow maintainers reasonable time to investigate and coordinate a fix before
public disclosure. Never submit secrets or production WCC records. The demo's
mock adapters do not authorise access to external systems.
