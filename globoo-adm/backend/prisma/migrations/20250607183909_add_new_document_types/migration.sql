-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'WORKER_CONTRACT';
ALTER TYPE "DocumentType" ADD VALUE 'SERVICE_CONTRACT';
ALTER TYPE "DocumentType" ADD VALUE 'NDA';
ALTER TYPE "DocumentType" ADD VALUE 'INVOICE';
ALTER TYPE "DocumentType" ADD VALUE 'RECEIPT';
ALTER TYPE "DocumentType" ADD VALUE 'REPORT';
ALTER TYPE "DocumentType" ADD VALUE 'PROPOSAL';
ALTER TYPE "DocumentType" ADD VALUE 'MEMO';
ALTER TYPE "DocumentType" ADD VALUE 'LETTER';
ALTER TYPE "DocumentType" ADD VALUE 'FORM';
ALTER TYPE "DocumentType" ADD VALUE 'POLICY';
ALTER TYPE "DocumentType" ADD VALUE 'PRESENTATION';
