// scripts/migrate.ts — Run Prisma migrations programmatically
// Usage: npx tsx scripts/migrate.ts

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverDir = path.resolve(__dirname, '..', 'server');

const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;

console.log(green('🚀 Running Prisma migrations...'));
console.log(`   Working directory: ${serverDir}`);

try {
  execSync('npx prisma migrate deploy', {
    cwd: serverDir,
    stdio: 'inherit',
  });

  console.log(green('✅ Migrations applied successfully.'));
} catch (error) {
  console.error(red('❌ Migration failed.'));
  if (error instanceof Error) {
    console.error(red(`   ${error.message}`));
  }
  process.exit(1);
}
