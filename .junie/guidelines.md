# Junie Project Guidelines (FamilyFood)

These guidelines define how Junie should work in this repository.
They apply to all tasks unless the user explicitly overrides them.

## 1) How to work
- Prefer small, reviewable changes. Avoid big refactors unless asked.
- Before editing, briefly identify the files you will touch and why.
- After edits: run the most relevant checks/tests and report results.
- If something is ambiguous, ask 1–3 targeted questions instead of guessing.

## 2) Skill selection (important)
This repo has Junie Skills under `.junie/skills/*` (each with `SKILL.md`).

When a task matches a skill, do BOTH:
1) State which skill you’re applying (by skill id/name).
2) Follow that skill’s guardrails and output expectations.

If multiple skills apply, pick a primary one and note secondary ones.

## 3) Definition of Done
A task is “done” when:
- The feature/bugfix matches the user request
- The project builds (as applicable)
- Relevant tests pass (or you clearly explain why they can’t be run)
- No obvious lint/formatting regressions are introduced

## 4) Backend (Symfony/API Platform) rules
- Keep domain/business logic out of controllers; use services/state processors.
- Prefer explicit validation and clear API contracts.
- Avoid breaking API changes unless explicitly approved.

Suggested commands (choose what fits the task):
- Composer install: `composer install`
- Tests: `php bin/phpunit`

## 5) Frontend (React/TS) rules
- TypeScript-first, avoid `any`.
- Add Testing Library tests for user-visible behavior for new logic.
- Keep changes consistent with existing formatting.

Suggested commands:
- Install: `npm ci` (or `npm install` if appropriate)
- Tests: `npm test`
- Build: `npm run build`

## 6) DevOps (Ansible) rules
- Idempotency first: reruns should not cause drift.
- Prefer modules over `shell/command`.
- Never commit secrets; use placeholders like `{{ vault_* }}`.

## 7) Safety / secrets
- Do not print or store credentials, tokens, private keys.
- Use placeholders like `<TOKEN>` or `{{ vault_token }}` in examples.

## 8) Communication style
- Provide short progress updates.
- When unsure, explain options with tradeoffs and ask for confirmation.
