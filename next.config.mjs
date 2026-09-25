// A partial or privileged backend configuration must fail the build, never fall back to demo.
const registrationUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
const registrationKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(Boolean(registrationUrl)!==Boolean(registrationKey))throw new Error('Configure both the Supabase URL and public key.');
if(registrationKey){
 if(registrationKey.startsWith('sb_secret_'))throw new Error('Use a public Supabase key, never a secret key.');
 if(registrationKey.startsWith('eyJ')){let claims;try{claims=JSON.parse(Buffer.from(registrationKey.split('.')[1],'base64url').toString());}catch{}if(claims?.role==='service_role')throw new Error('A service-role key cannot be included in the website.');}
}
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};
export default nextConfig;
