# Prisma migration workflow

This repository uses Prisma Migrate for schema changes. Production builds run `prisma migrate deploy`; they must not run `prisma db push --accept-data-loss`.

## One-time production baseline

The repository contains `prisma/migrations/0001_baseline`, generated from the current schema with `prisma migrate diff --from-empty --to-schema-datamodel`. It is additive and contains no `DROP` or `TRUNCATE` statements.

Before the first production deployment that uses this history, take a database backup and inspect the baseline SQL. Then, using the production `DATABASE_URL` in a protected operator environment, run:

```bash
pnpm exec prisma migrate resolve --applied 0001_baseline
pnpm exec prisma migrate deploy
```

`pnpm db:baseline` is provided as a shorthand for the first command. Do not run the baseline migration itself against an already-populated database; resolving it as applied records the existing schema without recreating tables.

## Creating future migrations

1. Change `prisma/schema.prisma` in a development branch.
2. Use a disposable development database and run `pnpm exec prisma migrate dev --name describe_change`.
3. Review the generated SQL for destructive operations, lock duration, nullability changes, and backfill requirements.
4. Test the migration against a recent database backup or staging clone.
5. Commit the migration directory and schema together.
6. Deploy through the normal release process; the build runs `prisma migrate deploy` before `next build`.

For a destructive change, use an expand-and-contract rollout: add the replacement structure, backfill data, deploy code that supports both forms, remove the old structure only in a later reviewed migration, and retain a tested backup and rollback plan.

## Useful commands

```bash
pnpm exec prisma validate
pnpm exec prisma format
pnpm exec prisma migrate status
pnpm db:migrate
```

`pnpm db:push` remains available for disposable local prototyping only. It is not a production deployment command.
