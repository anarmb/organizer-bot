-- CreateTable
CREATE TABLE "Tarea" (
    "id" SERIAL NOT NULL,
    "chatId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forWho" TEXT NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);
