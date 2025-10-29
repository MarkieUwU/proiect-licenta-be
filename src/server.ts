import express from "express";
import routes from "./routes";
import { PrismaClient } from "@prisma/client";
import { apiErrorHandler } from "./error/api-error-handler";
import { prismaErrorHandler } from "./error/prisma-error-handler";
import { routeNotFoundHandler } from "./middleware/route-not-found-handler";
import cors from "cors";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 8001;

export const prisma = new PrismaClient();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use("/", routes);

app.use(prismaErrorHandler);

app.use(routeNotFoundHandler);

app.use(apiErrorHandler);

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

async function gracefulShutdown(signal: string) {
  console.log(`\n Received ${signal}. String graceful shutdown...`);

  try {
    server.close(() => {
      console.log('HTTP server closed');
    });

    await prisma.$disconnect();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.log('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await prisma.$disconnect();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await prisma.$disconnect();
  process.exit(1);
})
