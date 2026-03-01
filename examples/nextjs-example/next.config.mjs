/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: config => {
    config.ignoreWarnings = [
      { module: /src\/app\/component\/MathLiveComponent\.tsx/ },
    ];

    return config;
  }
};

export default nextConfig;
