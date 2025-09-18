"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadTempFile = exports.uploadFile = exports.getObjectUrl = exports.deleteFile = exports.BUCKET = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
const MinIo = __importStar(require("minio"));
const path_1 = require("path");
const logger = new logger_config_1.Logger('S3 Service');
const BUCKET = new env_config_1.ConfigService().get('S3');
exports.BUCKET = BUCKET;
const minioClient = (() => {
    if (BUCKET?.ENABLE) {
        return new MinIo.Client({
            endPoint: BUCKET.ENDPOINT,
            port: BUCKET.PORT,
            useSSL: BUCKET.USE_SSL,
            accessKey: BUCKET.ACCESS_KEY,
            secretKey: BUCKET.SECRET_KEY,
            region: BUCKET.REGION,
        });
    }
})();
const bucketName = process.env.S3_BUCKET;
const bucketExists = async () => {
    if (minioClient) {
        try {
            const list = await minioClient.listBuckets();
            return list.find((bucket) => bucket.name === bucketName);
        }
        catch (error) {
            return false;
        }
    }
};
const setBucketPolicy = async () => {
    if (minioClient) {
        const policy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: '*',
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${bucketName}/*`],
                },
            ],
        };
        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    }
};
const createBucket = async () => {
    if (minioClient) {
        try {
            const exists = await bucketExists();
            if (!exists) {
                await minioClient.makeBucket(bucketName);
            }
            if (!BUCKET.SKIP_POLICY) {
                await setBucketPolicy();
            }
            logger.info(`S3 Bucket ${bucketName} - ON`);
            return true;
        }
        catch (error) {
            logger.error('S3 ERROR:');
            logger.error(error);
            return false;
        }
    }
};
createBucket();
const uploadFile = async (fileName, file, size, metadata) => {
    if (minioClient) {
        const objectName = (0, path_1.join)('evolution-api', fileName);
        try {
            metadata['custom-header-application'] = 'evolution-api';
            return await minioClient.putObject(bucketName, objectName, file, size, metadata);
        }
        catch (error) {
            logger.error(error);
            return error;
        }
    }
};
exports.uploadFile = uploadFile;
const getObjectUrl = async (fileName, expiry) => {
    if (minioClient) {
        try {
            const objectName = (0, path_1.join)('evolution-api', fileName);
            if (expiry) {
                return await minioClient.presignedGetObject(bucketName, objectName, expiry);
            }
            return await minioClient.presignedGetObject(bucketName, objectName);
        }
        catch (error) {
            throw new _exceptions_1.BadRequestException(error?.message);
        }
    }
};
exports.getObjectUrl = getObjectUrl;
const uploadTempFile = async (folder, fileName, file, size, metadata) => {
    if (minioClient) {
        const objectName = (0, path_1.join)(folder, fileName);
        try {
            metadata['custom-header-application'] = 'evolution-api';
            return await minioClient.putObject(bucketName, objectName, file, size, metadata);
        }
        catch (error) {
            logger.error(error);
            return error;
        }
    }
};
exports.uploadTempFile = uploadTempFile;
const deleteFile = async (folder, fileName) => {
    if (minioClient) {
        const objectName = (0, path_1.join)(folder, fileName);
        try {
            return await minioClient.removeObject(bucketName, objectName);
        }
        catch (error) {
            logger.error(error);
            return error;
        }
    }
};
exports.deleteFile = deleteFile;
