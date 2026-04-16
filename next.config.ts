import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 엔진에서 data/*.json (최대 9MB)을 import하므로 서버 번들 크기 제한 해제
  serverExternalPackages: ['@anthropic-ai/sdk'],
};

export default nextConfig;
