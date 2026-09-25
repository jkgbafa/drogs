import test from 'node:test';
import assert from 'node:assert/strict';
import {portraitUrl} from '../src/runtime/photo-url.js';
test('R2 links activate only for a verified object and a configured public URL',()=>{
 const config={publicBaseUrl:'',objects:{'assets/pastors/test.webp':{key:'portraits/aa/hash.webp'}}};
 assert.equal(portraitUrl('assets/pastors/test.webp','../',config),'../assets/pastors/test.webp');
 config.publicBaseUrl='https://example.r2.dev';
 assert.equal(portraitUrl('assets/pastors/test.webp','../',config),'https://example.r2.dev/portraits/aa/hash.webp');
 assert.equal(portraitUrl('assets/pastors/other.webp','../',config),'../assets/pastors/other.webp');
 config.publicBaseUrl='https://name:secret@example.com';
 assert.throws(()=>portraitUrl('assets/pastors/test.webp','',config));
});
