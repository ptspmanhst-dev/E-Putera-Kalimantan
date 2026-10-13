import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  allowedDevOrigins: ['ais-dev-uijwycpt2ftlmnea7ryrzk-233376946516.asia-southeast1.run.app'],
};

export default nextConfig;
