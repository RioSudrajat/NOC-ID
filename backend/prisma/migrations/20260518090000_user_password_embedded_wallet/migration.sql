-- Add user/password auth fields and encrypted embedded wallet storage.
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN "embeddedWalletEncryptedSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "embeddedWalletNonce" TEXT;
ALTER TABLE "User" ADD COLUMN "embeddedWalletTag" TEXT;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
