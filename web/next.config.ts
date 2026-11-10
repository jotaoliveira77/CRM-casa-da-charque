import type { NextConfig } from 'next';

/**
 * O navegador chama sempre /api/... no mesmo endereço do front, e o Next repassa para a API.
 * Assim o cookie de sessão fica no mesmo domínio e não é preciso configurar CORS.
 * API_URL é lido no build (no Docker, vem como build arg).
 */
const API_URL = process.env.API_URL ?? 'http://localhost:3333';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
