/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.shopify.com'],
  },
  output: 'standalone',  // Usando standalone para que o build seja feito corretamente para as rotas dinâmicas
  distDir: 'out',    // Diretório de saída para exportação estática de páginas
  experimental: {
    appDir: true,  // Habilita o App Router (se estiver usando Next.js 13+ com o App Router)
  },
};

module.exports = nextConfig;
