import { S3 } from '@config/env.config';
import * as MinIo from 'minio';
import { Readable, Transform } from 'stream';
declare const BUCKET: S3;
interface Metadata extends MinIo.ItemBucketMetadata {
    'Content-Type': string;
}
declare const uploadFile: (fileName: string, file: Buffer | Transform | Readable, size: number, metadata: Metadata) => Promise<any>;
declare const getObjectUrl: (fileName: string, expiry?: number) => Promise<string>;
declare const uploadTempFile: (folder: string, fileName: string, file: Buffer | Transform | Readable, size: number, metadata: Metadata) => Promise<any>;
declare const deleteFile: (folder: string, fileName: string) => Promise<any>;
export { BUCKET, deleteFile, getObjectUrl, uploadFile, uploadTempFile };
