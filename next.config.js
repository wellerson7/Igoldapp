/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
    ],
  },
  output: 'standalone', // Para permitir exportação estática e gerar um build independente
  distDir: 'out', // Diretório de saída para exportação estática (gerando os arquivos na pasta 'out/')
  // Removido 'appDir' já que não é mais necessário
};

module.exports = nextConfig;
