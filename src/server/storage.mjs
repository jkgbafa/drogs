import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { HttpError, rateLimit } from './auth.mjs';
export async function prepareImage(bytes, contentType) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType) || bytes.length > 5 * 1024 * 1024 || !bytes.length)
    throw new HttpError(400, 'Choose a JPG, PNG or WebP image smaller than 5 MB.');
  try {
    const source = sharp(bytes, { limitInputPixels: 40000000, failOn: 'error' });
    const metadata = await source.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages || 1) !== 1) throw Error('Invalid image');
    // Decode on the server and strip EXIF/location metadata before storing the image.
    return await source.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
  } catch { throw new HttpError(400, 'This image could not be opened. Choose a valid, still photo.'); }
}
export function canReadMedia(state, actor, media) {
  if (media.owner_id === actor.id || actor.office) return true;
  // A supervising bishop may see submitted portraits, but never someone else's receipt.
  if (media.kind !== 'portrait') return false;
  const profile = state.profiles.find(p => p.id === actor.id && p.role === 'bishop' && p.bishopApproved);
  return Boolean(profile && state.registrations.some(r => r.status !== 'draft' && r.data.role === 'pastor' &&
    r.data.photo === media.object_key && r.data.bishopId === (profile.referenceId || profile.id)));
}
export async function assertOwnedMedia(conn, actor, path, kind) {
  if (typeof path !== 'string' || path.length > 512) throw new HttpError(400, 'Invalid image reference.');
  const [[media]] = await conn.execute('SELECT owner_id,kind FROM dr_media WHERE object_key=?', [path]);
  if (!media || media.owner_id !== actor.id || media.kind !== kind) throw new HttpError(400, 'Upload your own image before continuing.');
}
export function createStorage({ config, pool, client }) {
  const s3 = client || new S3Client({ region: 'auto', endpoint: `https://${config.r2.account}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.r2.accessKeyId, secretAccessKey: config.r2.secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' });
  const Bucket = config.r2.bucket;
  return {
    async upload(actor, bytes, contentType, kind) {
      if (!['portrait', 'receipt'].includes(kind)) throw new HttpError(400, 'Invalid upload type.');
      await rateLimit(pool, config, `upload:${actor.id}`, 30, 3600000);
      const body = await prepareImage(bytes, contentType);
      const Key = `${actor.id}/${kind}/${randomUUID()}.webp`;
      await s3.send(new PutObjectCommand({ Bucket, Key, Body: body, ContentType: 'image/webp', CacheControl: 'private, max-age=300' }));
      try {
        await pool.execute('INSERT INTO dr_media (object_key,owner_id,kind,content_type,size_bytes,created_at) VALUES (?,?,?,?,?,?)', [Key, actor.id, kind, 'image/webp', body.length, Date.now()]);
      } catch (error) {
        await s3.send(new DeleteObjectCommand({ Bucket, Key })).catch(() => {});
        throw error;
      }
      return Key;
    },
    url(key) { return getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), { expiresIn: 3600 }); },
  };
}
