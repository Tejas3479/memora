// scripts/seed.ts — Seed the database with test data
// Usage: npx tsx scripts/seed.ts
//
// Imports PrismaClient from @prisma/client (using the server package's schema).
// Uses upsert where possible to be idempotent — safe to run multiple times.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-computed bcrypt hash for 'password123' (cost factor 10)
const PASSWORD_HASH = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PQm4yKOsQN5UGvOgF3EUG';

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👤 Creating test users...');

  const alice = await prisma.user.upsert({
    where: { email: 'alice@memora.dev' },
    update: {},
    create: {
      email: 'alice@memora.dev',
      name: 'Alice Johnson',
      passwordHash: PASSWORD_HASH,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    },
  });
  console.log(`   ✅ User created: ${alice.email}`);

  const bob = await prisma.user.upsert({
    where: { email: 'bob@memora.dev' },
    update: {},
    create: {
      email: 'bob@memora.dev',
      name: 'Bob Smith',
      passwordHash: PASSWORD_HASH,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    },
  });
  console.log(`   ✅ User created: ${bob.email}`);

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@memora.dev' },
    update: {},
    create: {
      email: 'charlie@memora.dev',
      name: 'Charlie Davis',
      passwordHash: PASSWORD_HASH,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    },
  });
  console.log(`   ✅ User created: ${charlie.email}`);

  // ── Team ───────────────────────────────────────────────────────────────────
  console.log('\n🏢 Creating test team...');

  const team = await prisma.team.upsert({
    where: { slug: 'memora-team' },
    update: {},
    create: {
      name: 'Memora Team',
      slug: 'memora-team',
    },
  });
  console.log(`   ✅ Team created: ${team.name}`);

  console.log('👥 Assigning team roles...');

  await prisma.teamMember.upsert({
    where: {
      userId_teamId: { userId: alice.id, teamId: team.id },
    },
    update: {},
    create: {
      userId: alice.id,
      teamId: team.id,
      role: 'OWNER',
    },
  });
  console.log(`   ✅ ${alice.name} → OWNER`);

  await prisma.teamMember.upsert({
    where: {
      userId_teamId: { userId: bob.id, teamId: team.id },
    },
    update: {},
    create: {
      userId: bob.id,
      teamId: team.id,
      role: 'MEMBER',
    },
  });
  console.log(`   ✅ ${bob.name} → MEMBER`);

  await prisma.teamMember.upsert({
    where: {
      userId_teamId: { userId: charlie.id, teamId: team.id },
    },
    update: {},
    create: {
      userId: charlie.id,
      teamId: team.id,
      role: 'MEMBER',
    },
  });
  console.log(`   ✅ ${charlie.name} → MEMBER`);

  // ── Subscriptions ──────────────────────────────────────────────────────────
  console.log('\n💳 Creating test subscriptions...');

  await prisma.subscription.upsert({
    where: { userId: alice.id },
    update: {},
    create: {
      userId: alice.id,
      plan: 'PRO',
      status: 'ACTIVE',
      stripeCustomerId: 'cus_test_alice_pro',
      stripeSubscriptionId: 'sub_test_alice_pro',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('   ✅ Alice → PRO (ACTIVE)');

  await prisma.subscription.upsert({
    where: { userId: bob.id },
    update: {},
    create: {
      userId: bob.id,
      plan: 'FREE',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('   ✅ Bob → FREE (ACTIVE)');

  // ── Integrations ───────────────────────────────────────────────────────────
  console.log('\n🔗 Creating test integrations...');

  await prisma.integration.upsert({
    where: {
      userId_provider: { userId: alice.id, provider: 'SLACK' },
    },
    update: {},
    create: {
      userId: alice.id,
      provider: 'SLACK',
      accessToken: 'xoxb-test-slack-token-alice',
      refreshToken: 'xoxr-test-slack-refresh-alice',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      metadata: {
        teamId: 'T_TEST_SLACK',
        teamName: 'Memora Workspace',
        botUserId: 'U_TEST_BOT',
      },
    },
  });
  console.log('   ✅ Alice → SLACK');

  await prisma.integration.upsert({
    where: {
      userId_provider: { userId: alice.id, provider: 'NOTION' },
    },
    update: {},
    create: {
      userId: alice.id,
      provider: 'NOTION',
      accessToken: 'ntn_test_notion_token_alice',
      metadata: {
        workspaceId: 'ws_test_notion',
        workspaceName: 'Memora Notes',
      },
    },
  });
  console.log('   ✅ Alice → NOTION');

  // ── Feedback ───────────────────────────────────────────────────────────────
  console.log('\n📝 Creating test feedback entries...');

  await prisma.feedback.create({
    data: {
      userId: alice.id,
      type: 'FEATURE_REQUEST',
      message: 'It would be great to have a calendar view for memories organized by date.',
      rating: 5,
    },
  });
  console.log('   ✅ Feedback from Alice (feature request)');

  await prisma.feedback.create({
    data: {
      userId: bob.id,
      type: 'BUG_REPORT',
      message: 'Search results occasionally show duplicates when using source filters.',
      rating: 3,
    },
  });
  console.log('   ✅ Feedback from Bob (bug report)');

  await prisma.feedback.create({
    data: {
      userId: charlie.id,
      type: 'GENERAL',
      message: 'Love the product! The knowledge graph visualization is amazing.',
      rating: 5,
    },
  });
  console.log('   ✅ Feedback from Charlie (general)');

  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
