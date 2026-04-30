import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const locks = await p.$queryRaw`SELECT pid FROM pg_locks WHERE locktype = 'advisory' AND objid IS NOT NULL AND granted = true` as { pid: number }[];
  for (const l of locks) {
    await p.$executeRaw`SELECT pg_terminate_backend(${l.pid}::integer)`;
    console.log('Killed PID', l.pid);
  }
  console.log('Done, locks cleared:', locks.length);
  await p.$disconnect();
})();
