import storage from '../../data/photo-storage.json' with { type: 'json' };
// Only verified uploaded objects use R2. Until the public URL is configured,
// the existing portrait remains available from the site's local assets.
export function portraitUrl(path,localPrefix='',config=storage){
  if(!path)return '';
  const object=config.objects?.[path];
  if(object&&config.publicBaseUrl){
    const base=new URL(config.publicBaseUrl);
    if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw new Error('Invalid photo storage URL');
    return `${base.href.replace(/\/$/,'')}/${object.key.split('/').map(encodeURIComponent).join('/')}`;
  }
  return `${localPrefix}${path}`;
}
