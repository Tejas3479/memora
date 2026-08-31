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

  // ── Folders ─────────────────────────────────────────────────────────────────
  console.log('\n📁 Creating test folders...');

  let workFolder = await prisma.folder.findFirst({
    where: { userId: alice.id, name: 'Work & Projects' },
  });
  if (!workFolder) {
    workFolder = await prisma.folder.create({
      data: {
        userId: alice.id,
        name: 'Work & Projects',
        description: 'Engineering and architecture documentation',
        color: '#7c3aed',
        icon: 'folder',
      },
    });
  }
  console.log(`   ✅ Folder created: ${workFolder.name}`);

  let readingFolder = await prisma.folder.findFirst({
    where: { userId: alice.id, name: 'Reading List' },
  });
  if (!readingFolder) {
    readingFolder = await prisma.folder.create({
      data: {
        userId: alice.id,
        name: 'Reading List',
        description: 'Articles, papers, and bookmarks',
        color: '#06b6d4',
        icon: 'book',
      },
    });
  }
  console.log(`   ✅ Folder created: ${readingFolder.name}`);

  // ── Memories (Relational) ───────────────────────────────────────────────────
  console.log('\n🧠 Creating test memories...');

  let memory1 = await prisma.memory.findFirst({
    where: { userId: alice.id, title: 'Scaling Qdrant for Real-Time Memory Layers' },
  });
  if (!memory1) {
    memory1 = await prisma.memory.create({
      data: {
        userId: alice.id,
        title: 'Scaling Qdrant for Real-Time Memory Layers',
        content: 'To scale Qdrant in production, we use HNSW index construction and scalar quantization (int8). This reduces RAM usage by 75% while maintaining 99% retrieval precision for 1024-dimension Voyage-3 embeddings.',
        source: 'WEB',
        url: 'https://qdrant.tech/articles/scaling-vector-search',
        folderId: workFolder.id,
        metadata: {
          tags: ['qdrant', 'vector-search', 'scaling'],
          author: 'Vector Search Team',
        },
      },
    });
  }
  console.log(`   ✅ Memory created: ${memory1.title}`);

  let memory2 = await prisma.memory.findFirst({
    where: { userId: alice.id, title: 'Fastify v5 Architecture & Plugin Isolation' },
  });
  if (!memory2) {
    memory2 = await prisma.memory.create({
      data: {
        userId: alice.id,
        title: 'Fastify v5 Architecture & Plugin Isolation',
        content: 'Fastify uses an encapsulated context tree for plugins. Decorators registered inside a plugin remain private unless fastify-plugin (fp) wrapper is used. CORS and rate-limiting should be registered at the root instance.',
        source: 'NOTE',
        url: 'notes://fastify-architecture',
        folderId: workFolder.id,
        metadata: {
          tags: ['fastify', 'backend', 'architecture'],
        },
      },
    });
  }
  console.log(`   ✅ Memory created: ${memory2.title}`);

  let memory3 = await prisma.memory.findFirst({
    where: { userId: bob.id, title: 'React 19 Server Components & Actions' },
  });
  if (!memory3) {
    memory3 = await prisma.memory.create({
      data: {
        userId: bob.id,
        title: 'React 19 Server Components & Actions',
        content: 'React 19 introduces native useActionState, useOptimistic, and compiler-level memoization. Client components hydrate progressively while server boundaries stream HTML.',
        source: 'WEB',
        url: 'https://react.dev/blog/2024/12/05/react-19',
        metadata: {
          tags: ['react', 'frontend', 'web'],
        },
      },
    });
  }
  console.log(`   ✅ Memory created: ${memory3.title}`);

  // ── Highlights ─────────────────────────────────────────────────────────────
  console.log('\n🖍️ Creating test highlights...');

  await prisma.highlight.create({
    data: {
      userId: alice.id,
      memoryId: memory1.id,
      url: memory1.url,
      text: 'scalar quantization (int8) reduces RAM usage by 75% while maintaining 99% retrieval precision',
      note: 'Crucial metric for capacity planning',
      color: 'yellow',
    },
  });
  console.log('   ✅ Highlight added to Memory 1');

  // ── Comments ───────────────────────────────────────────────────────────────
  console.log('\n💬 Creating test comments...');

  await prisma.comment.create({
    data: {
      userId: alice.id,
      memoryId: memory1.id,
      text: 'We should verify this benchmark against 10M vectors on our staging cluster.',
    },
  });
  console.log('   ✅ Comment added to Memory 1');

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
      memoryId: memory1.id,
      signal: 'search_upvote',
      rating: 5,
      comment: 'Accurate retrieval for quantization configuration.',
    },
  });
  console.log('   ✅ Feedback from Alice (search_upvote)');

  await prisma.feedback.create({
    data: {
      userId: bob.id,
      memoryId: memory3.id,
      signal: 'search_click',
      rating: 4,
      comment: 'Relevant documentation hit.',
    },
  });
  console.log('   ✅ Feedback from Bob (search_click)');

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
