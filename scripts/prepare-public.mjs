import {mkdir,cp,writeFile,rm} from 'node:fs/promises';
import {dirname} from 'node:path';
// Only registration examples and branding are published in the new preview.
// The complete reconciled portrait library remains untouched in assets/.
const registrationAssets=['assets/mitre-transparent.png','assets/bishops/001.jpg','assets/pastors/reconciled-5.webp'];
await mkdir('public',{recursive:true});
await rm('public/assets',{recursive:true,force:true});
for(const file of registrationAssets){await mkdir(dirname(`public/${file}`),{recursive:true});await cp(file,`public/${file}`);}
await writeFile('public/.nojekyll','');
