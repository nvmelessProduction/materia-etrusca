# Materia Etrusca

E-commerce dei vasi-scultura in cemento colato a mano di Cerveteri.

```bash
pnpm install
cp .env.example .env.local   # e valorizza almeno DATABASE_URL
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Le convenzioni di progetto, i design token e le regole visive stanno in [`CLAUDE.md`](./CLAUDE.md).
Le istruzioni di messa in produzione stanno in [`docs/deploy.md`](./docs/deploy.md).
