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

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
