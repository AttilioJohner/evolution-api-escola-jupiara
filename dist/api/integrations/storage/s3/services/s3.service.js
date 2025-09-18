"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const minio_server_1 = require("@api/integrations/storage/s3/libs/minio.server");
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
class S3Service {
    constructor(prismaRepository) {
        this.prismaRepository = prismaRepository;
        this.logger = new logger_config_1.Logger('S3Service');
    }
    async getMedia(instance, query) {
        try {
            const where = {
                instanceId: instance.instanceId,
                ...query,
            };
            const media = await this.prismaRepository.media.findMany({
                where,
                select: {
                    id: true,
                    fileName: true,
                    type: true,
                    mimetype: true,
                    createdAt: true,
                    Message: true,
                },
            });
            if (!media || media.length === 0) {
                throw 'Media not found';
            }
            return media;
        }
        catch (error) {
            throw new _exceptions_1.BadRequestException(error);
        }
    }
    async getMediaUrl(instance, data) {
        const media = (await this.getMedia(instance, { id: data.id }))[0];
        const mediaUrl = await (0, minio_server_1.getObjectUrl)(media.fileName, data.expiry);
        return {
            mediaUrl,
            ...media,
        };
    }
}
exports.S3Service = S3Service;
