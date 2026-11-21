import { createServer } from 'node:http';
import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const server = createServer(app);

server.listen(env.PORT, () => {
  console.log(`[server] API berjalan di http://localhost:${env.PORT}`);
  console.log(`[server] Health check: http://localhost:${env.PORT}/health`);
});

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`[server] ${signal} diterima, menutup server...`);

  const forceExitTimer = setTimeout(() => {
    console.error('[server] Gagal menutup server tepat waktu, keluar paksa');
    process.exit(1);
  }, 10_000);

  forceExitTimer.unref();

  server.close(async () => {
    try {
      await prisma.$disconnect();
      process.exit(0);
    } catch (error) {
      console.error('[server] Gagal memutus koneksi database', error);
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[server] Uncaught exception:', error);
  void shutdown('uncaughtException');
});
