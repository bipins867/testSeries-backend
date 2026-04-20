import app from './app';
import { config } from './common/config';
import { logger } from './common/logger';
import { connectDatabase } from './database/connection';
import { runSeeders } from './database/seeders/initial';

async function bootstrap() {
  try {
    // 1. Connect to MySQL & sync models
    await connectDatabase();

    // 2. Run seeders (roles, admin, catalog)
    await runSeeders();

    // 3. Start Express server
    app.listen(config.port, () => {
      logger.info(`
╔══════════════════════════════════════════════╗
║   UPSC Quiz Backend — Running               ║
║   Port:  ${String(config.port).padEnd(36)}║
║   Env:   ${config.nodeEnv.padEnd(36)}║
║   API:   /api/v1                             ║
║   Model: ${config.openai.model.padEnd(36)}║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
