import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { app } from './app.js';

async function bootstrap() {
  await connectDb();

  const server = app.listen(env.PORT, () => {
    console.log(`Backend running on http://localhost:${env.PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Closing server...`);
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
