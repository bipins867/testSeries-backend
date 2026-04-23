import { Sequelize } from "sequelize";
import { config } from "../common/config";
import { logger } from "../common/logger";

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true, // snake_case columns
    },
  },
);

/**
 * Test the database connection and sync models.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info("✅ Database connection established successfully.");

    if (!config.isProduction) {
      await sequelize.sync({ alter: true });
      logger.info("✅ Database models synchronized (alter: true).");
    } else {
      await sequelize.sync();
      logger.info("✅ Database models synchronized for production (create missing only).");
    }
  } catch (error) {
    logger.error("❌ Unable to connect to the database:", error);
    throw error;
  }
}

export { sequelize };
