import express from "express";
import routes from "./src/routes";
import { PrismaClient } from "@prisma/client";
import { apiErrorHandler } from "./src/error/api-error-handler";
import { prismaErrorHandler } from "./src/error/prisma-error-handler";
import { routeNotFoundHandler } from "./src/middleware/route-not-found-handler";

const app = express();
const port = 8000;

const prisma = new PrismaClient();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.use(prismaErrorHandler);

app.use(routeNotFoundHandler);

app.use(apiErrorHandler);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
