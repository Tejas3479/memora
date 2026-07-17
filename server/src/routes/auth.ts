import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { ValidationError, UnauthorizedError } from '../lib/errors.js';
import { authMiddleware } from '../middleware/auth.js';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/register', async (request, reply) => {
    const { email, password, name } = request.body as any;
    if (!email || !password || !name) {
      throw new ValidationError('Email, password, and name are required');
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new ValidationError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        settings: {},
      },
    });

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, plan: user.plan },
      config.jwt.privateKey as Secret,
      { algorithm: 'RS256', expiresIn: config.jwt.accessExpiresIn } as SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.privateKey as Secret,
      { algorithm: 'RS256', expiresIn: config.jwt.refreshExpiresIn } as SignOptions
    );

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });

    return reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        createdAt: user.createdAt,
      },
      accessToken,
    });
  });

  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as any;
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, plan: user.plan },
      config.jwt.privateKey as Secret,
      { algorithm: 'RS256', expiresIn: config.jwt.accessExpiresIn } as SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.privateKey as Secret,
      { algorithm: 'RS256', expiresIn: config.jwt.refreshExpiresIn } as SignOptions
    );

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
      },
      accessToken,
    };
  });

  fastify.post('/auth/refresh', async (request, reply) => {
    const token = request.cookies.refreshToken;
    if (!token) {
      throw new UnauthorizedError('Refresh token is missing');
    }

    try {
      const decoded = jwt.verify(token, config.jwt.publicKey, {
        algorithms: ['RS256'],
      }) as { userId: string };

      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, plan: user.plan },
        config.jwt.privateKey as Secret,
        { algorithm: 'RS256', expiresIn: config.jwt.accessExpiresIn } as SignOptions
      );

      return { accessToken };
    } catch (err) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  });

  fastify.post('/auth/logout', async (request, reply) => {
    reply.clearCookie('refreshToken', { path: '/auth/refresh' });
    return { success: true };
  });

  fastify.get('/auth/me', { preHandler: authMiddleware }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user?.userId },
    });
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      settings: user.settings,
    };
  });
}
