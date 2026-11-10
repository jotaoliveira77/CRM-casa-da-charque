import { z } from 'zod';

const esquema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET precisa ter pelo menos 16 caracteres'),
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('0.0.0.0'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform(v => v === 'true'),
  SEED_ADMIN_EMAIL: z.string().email().default('gerencia@casadacharque.local'),
  SEED_SENHA: z.string().min(6).default('charque123'),
  SEED_EXEMPLO: z
    .enum(['true', 'false'])
    .default('true')
    .transform(v => v === 'true'),
});

export const env = esquema.parse(process.env);
