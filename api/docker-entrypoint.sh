#!/bin/sh
# Aplica as migrações pendentes, prepara o banco na primeira subida e inicia a API.
set -e
npx prisma migrate deploy
node dist/seed.js
exec node dist/server.js
