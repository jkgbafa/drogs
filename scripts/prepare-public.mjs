import {mkdir,cp,writeFile,rm} from 'node:fs/promises';
// Explicit public-asset allowlist. Never export .private, source workbooks,
// API keys, local audit reports, or the repository itself.
await mkdir('public',{recursive:true});
await rm('public/assets',{recursive:true,force:true});
await cp('assets','public/assets',{recursive:true});
await writeFile('public/.nojekyll','');
