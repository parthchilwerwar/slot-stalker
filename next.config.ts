import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* reactCompiler was causing Turbopack failure for v16.2.6 local build. Turning off until plugins stabilized. */
}
export default nextConfig
