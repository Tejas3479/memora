import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';

function createUncompressedZip(filename: string, content: string): Buffer {
  const contentBuf = Buffer.from(content, 'utf-8');
  const makeCRCTable = () => {
    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      crcTable[n] = c;
    }
    return crcTable;
  };
  const crcTable = makeCRCTable();
  let crc = 0 ^ -1;
  for (let i = 0; i < contentBuf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ contentBuf[i]) & 0xFF];
  }
  crc = (crc ^ -1) >>> 0;

  const fnBuf = Buffer.from(filename, 'utf-8');
  const size = contentBuf.length;

  const lfh = Buffer.alloc(30 + fnBuf.length);
  lfh.writeUInt32LE(0x04034b50, 0);
  lfh.writeUInt16LE(10, 4);
  lfh.writeUInt16LE(0, 6);
  lfh.writeUInt16LE(0, 8);
  lfh.writeUInt16LE(0x5400, 10);
  lfh.writeUInt16LE(0x5400, 12);
  lfh.writeUInt32LE(crc, 14);
  lfh.writeUInt32LE(size, 18);
  lfh.writeUInt32LE(size, 22);
  lfh.writeUInt16LE(fnBuf.length, 26);
  lfh.writeUInt16LE(0, 28);
  fnBuf.copy(lfh, 30);

  const cdfh = Buffer.alloc(46 + fnBuf.length);
  cdfh.writeUInt32LE(0x02014b50, 0);
  cdfh.writeUInt16LE(10, 4);
  cdfh.writeUInt16LE(10, 6);
  cdfh.writeUInt16LE(0, 8);
  cdfh.writeUInt16LE(0, 10);
  cdfh.writeUInt16LE(0x5400, 12);
  cdfh.writeUInt16LE(0x5400, 14);
  cdfh.writeUInt32LE(crc, 16);
  cdfh.writeUInt32LE(size, 20);
  cdfh.writeUInt32LE(size, 24);
  cdfh.writeUInt16LE(fnBuf.length, 28);
  cdfh.writeUInt16LE(0, 30);
  cdfh.writeUInt16LE(0, 32);
  cdfh.writeUInt16LE(0, 34);
  cdfh.writeUInt16LE(0, 36);
  cdfh.writeUInt32LE(0, 38);
  cdfh.writeUInt32LE(0, 42);
  fnBuf.copy(cdfh, 46);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cdfh.length, 12);
  eocd.writeUInt32LE(lfh.length + contentBuf.length, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([lfh, contentBuf, cdfh, eocd]);
}

export default async function exportRoutes(fastify: FastifyInstance) {
  fastify.post('/api/export', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { format = 'json' } = request.body as any;

    const memories = await prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        folder: true,
        highlights: true,
      },
    });

    const exportData = memories.map((m) => ({
      id: m.id,
      title: m.title,
      content: m.content,
      source: m.source,
      url: m.url,
      folder: m.folder?.name || null,
      highlights: m.highlights.map((h) => ({ text: h.text, note: h.note })),
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    if (format === 'zip') {
      const jsonData = JSON.stringify(exportData, null, 2);
      const zipBuffer = createUncompressedZip('memora_export.json', jsonData);
      return { format: 'zip', data: zipBuffer.toString('base64'), filename: 'memora_export.zip' };
    }

    if (format === 'csv') {
      const headers = ['id', 'title', 'content', 'url', 'source', 'folder', 'createdAt'];
      const rows = exportData.map((r) => [
        r.id,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.content.replace(/"/g, '""')}"`,
        r.url,
        r.source,
        `"${(r.folder || '').replace(/"/g, '""')}"`,
        r.createdAt,
      ]);
      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      return { format: 'csv', data: csvContent };
    }

    return { format: 'json', data: exportData };
  });

  fastify.get('/api/export/download', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { format = 'json' } = request.query as any;

    const memories = await prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { folder: true, highlights: true },
    });

    const exportData = memories.map((m) => ({
      id: m.id,
      title: m.title,
      content: m.content,
      source: m.source,
      url: m.url,
      folder: m.folder?.name || null,
      highlights: m.highlights.map((h) => ({ text: h.text, note: h.note })),
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    if (format === 'csv') {
      const headers = ['id', 'title', 'content', 'url', 'source', 'folder', 'createdAt'];
      const rows = exportData.map((r) => [
        r.id,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.content.replace(/"/g, '""')}"`,
        r.url,
        r.source,
        `"${(r.folder || '').replace(/"/g, '""')}"`,
        r.createdAt,
      ]);
      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', 'attachment; filename="memora_export.csv"');
      return reply.send(csvContent);
    }

    if (format === 'zip') {
      const jsonData = JSON.stringify(exportData, null, 2);
      const zipBuffer = createUncompressedZip('memora_export.json', jsonData);
      reply.header('Content-Type', 'application/zip');
      reply.header('Content-Disposition', 'attachment; filename="memora_export.zip"');
      return reply.send(zipBuffer);
    }

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', 'attachment; filename="memora_export.json"');
    return reply.send(JSON.stringify(exportData, null, 2));
  });

  fastify.get('/api/export/status/:jobId', { preHandler: authMiddleware }, async () => {
    return { status: 'COMPLETED' };
  });
}
