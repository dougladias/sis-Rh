-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HR', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RG', 'CPF', 'CNH', 'PASSPORT', 'WORK_CONTRACT', 'MEDICAL_CERTIFICATE', 'ADMISSION_DOCUMENT', 'DISMISSAL_DOCUMENT', 'CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CLT', 'PJ');

-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_VACATION');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('DRAFT', 'PROCESSED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('EXPECTED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('EXPECTED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "terminationDate" TIMESTAMP(3),
    "salary" DECIMAL(10,2) NOT NULL,
    "allowance" DECIMAL(10,2),
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "contractType" "ContractType" NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'Geral',
    "status" "WorkerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_logs" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "entryTime" TIMESTAMP(3),
    "leaveTime" TIMESTAMP(3),
    "hoursWorked" DECIMAL(4,2),
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "absenceType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "description" TEXT,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "totalGrossSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalBenefits" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalNetSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "baseSalary" DECIMAL(10,2) NOT NULL,
    "totalBenefits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(10,2) NOT NULL,
    "status" "PayslipStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip_deductions" (
    "id" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "percentage" DECIMAL(5,4),
    "value" DECIMAL(10,2) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "payslip_deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip_benefits" (
    "id" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "value" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "payslip_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "value" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "issuerName" TEXT NOT NULL,
    "issuerDocument" TEXT,
    "issuerEmail" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientDocument" TEXT,
    "recipientEmail" TEXT,
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_attachments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'RG',
    "documentNumber" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "reason" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "hostDepartment" TEXT,
    "scheduledEntry" TIMESTAMP(3),
    "scheduledExit" TIMESTAMP(3),
    "actualEntry" TIMESTAMP(3),
    "actualExit" TIMESTAMP(3),
    "status" "VisitorStatus" NOT NULL DEFAULT 'EXPECTED',
    "temperature" DECIMAL(4,1),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_photos" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'RG',
    "documentNumber" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "serviceType" TEXT,
    "reason" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "hostDepartment" TEXT,
    "scheduledEntry" TIMESTAMP(3),
    "scheduledExit" TIMESTAMP(3),
    "actualEntry" TIMESTAMP(3),
    "actualExit" TIMESTAMP(3),
    "status" "ProviderStatus" NOT NULL DEFAULT 'EXPECTED',
    "contractNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_photos" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_files" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdBy" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "fileData" BYTEA NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_name_key" ON "profiles"("name");

-- CreateIndex
CREATE INDEX "profiles_name_idx" ON "profiles"("name");

-- CreateIndex
CREATE INDEX "profiles_isActive_idx" ON "profiles"("isActive");

-- CreateIndex
CREATE INDEX "user_permissions_userId_idx" ON "user_permissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_profileId_key" ON "user_permissions"("userId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "workers_employeeCode_key" ON "workers"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "workers_cpf_key" ON "workers"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "workers_email_key" ON "workers"("email");

-- CreateIndex
CREATE INDEX "workers_employeeCode_idx" ON "workers"("employeeCode");

-- CreateIndex
CREATE INDEX "workers_name_idx" ON "workers"("name");

-- CreateIndex
CREATE INDEX "workers_cpf_idx" ON "workers"("cpf");

-- CreateIndex
CREATE INDEX "workers_department_idx" ON "workers"("department");

-- CreateIndex
CREATE INDEX "workers_status_idx" ON "workers"("status");

-- CreateIndex
CREATE INDEX "workers_contractType_idx" ON "workers"("contractType");

-- CreateIndex
CREATE INDEX "worker_logs_workerId_idx" ON "worker_logs"("workerId");

-- CreateIndex
CREATE INDEX "worker_logs_date_idx" ON "worker_logs"("date");

-- CreateIndex
CREATE INDEX "worker_logs_isAbsent_idx" ON "worker_logs"("isAbsent");

-- CreateIndex
CREATE UNIQUE INDEX "worker_logs_workerId_date_key" ON "worker_logs"("workerId", "date");

-- CreateIndex
CREATE INDEX "payrolls_status_idx" ON "payrolls"("status");

-- CreateIndex
CREATE INDEX "payrolls_year_month_idx" ON "payrolls"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_month_year_key" ON "payrolls"("month", "year");

-- CreateIndex
CREATE INDEX "payslips_payrollId_idx" ON "payslips"("payrollId");

-- CreateIndex
CREATE INDEX "payslips_workerId_idx" ON "payslips"("workerId");

-- CreateIndex
CREATE INDEX "payslips_status_idx" ON "payslips"("status");

-- CreateIndex
CREATE INDEX "payslips_paymentDate_idx" ON "payslips"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payrollId_workerId_key" ON "payslips"("payrollId", "workerId");

-- CreateIndex
CREATE INDEX "payslip_deductions_payslipId_idx" ON "payslip_deductions"("payslipId");

-- CreateIndex
CREATE INDEX "payslip_deductions_code_idx" ON "payslip_deductions"("code");

-- CreateIndex
CREATE INDEX "payslip_benefits_payslipId_idx" ON "payslip_benefits"("payslipId");

-- CreateIndex
CREATE INDEX "payslip_benefits_code_idx" ON "payslip_benefits"("code");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "invoices_number_idx" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_issueDate_idx" ON "invoices"("issueDate");

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

-- CreateIndex
CREATE INDEX "invoices_value_idx" ON "invoices"("value");

-- CreateIndex
CREATE INDEX "invoice_attachments_invoiceId_idx" ON "invoice_attachments"("invoiceId");

-- CreateIndex
CREATE INDEX "visitors_name_idx" ON "visitors"("name");

-- CreateIndex
CREATE INDEX "visitors_documentNumber_idx" ON "visitors"("documentNumber");

-- CreateIndex
CREATE INDEX "visitors_status_idx" ON "visitors"("status");

-- CreateIndex
CREATE INDEX "visitors_scheduledEntry_idx" ON "visitors"("scheduledEntry");

-- CreateIndex
CREATE INDEX "visitors_actualEntry_idx" ON "visitors"("actualEntry");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_photos_visitorId_key" ON "visitor_photos"("visitorId");

-- CreateIndex
CREATE INDEX "providers_name_idx" ON "providers"("name");

-- CreateIndex
CREATE INDEX "providers_documentNumber_idx" ON "providers"("documentNumber");

-- CreateIndex
CREATE INDEX "providers_status_idx" ON "providers"("status");

-- CreateIndex
CREATE INDEX "providers_scheduledEntry_idx" ON "providers"("scheduledEntry");

-- CreateIndex
CREATE INDEX "providers_company_idx" ON "providers"("company");

-- CreateIndex
CREATE UNIQUE INDEX "provider_photos_providerId_key" ON "provider_photos"("providerId");

-- CreateIndex
CREATE INDEX "worker_files_workerId_idx" ON "worker_files"("workerId");

-- CreateIndex
CREATE INDEX "worker_files_documentType_idx" ON "worker_files"("documentType");

-- CreateIndex
CREATE INDEX "worker_files_category_idx" ON "worker_files"("category");

-- CreateIndex
CREATE INDEX "worker_files_expiresAt_idx" ON "worker_files"("expiresAt");

-- CreateIndex
CREATE INDEX "document_templates_name_idx" ON "document_templates"("name");

-- CreateIndex
CREATE INDEX "document_templates_type_idx" ON "document_templates"("type");

-- CreateIndex
CREATE INDEX "document_templates_category_idx" ON "document_templates"("category");

-- CreateIndex
CREATE INDEX "document_templates_isActive_idx" ON "document_templates"("isActive");

-- CreateIndex
CREATE INDEX "document_templates_createdAt_idx" ON "document_templates"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_category_idx" ON "system_configs"("category");

-- CreateIndex
CREATE INDEX "system_configs_key_idx" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_idx" ON "activity_logs"("entityType");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_logs" ADD CONSTRAINT "worker_logs_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_deductions" ADD CONSTRAINT "payslip_deductions_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_benefits" ADD CONSTRAINT "payslip_benefits_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_attachments" ADD CONSTRAINT "invoice_attachments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_photos" ADD CONSTRAINT "visitor_photos_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_photos" ADD CONSTRAINT "provider_photos_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_files" ADD CONSTRAINT "worker_files_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
