-- CreateTable
CREATE TABLE "Connection" (
    "followerId" INTEGER NOT NULL,
    "followingId" INTEGER NOT NULL,
    "pending" BOOLEAN NOT NULL,

    PRIMARY KEY ("followingId", "followerId"),
    CONSTRAINT "Connection_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Connection_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

