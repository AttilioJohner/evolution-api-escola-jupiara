"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Controller = void 0;
class S3Controller {
    constructor(s3Service) {
        this.s3Service = s3Service;
    }
    async getMedia(instance, data) {
        return this.s3Service.getMedia(instance, data);
    }
    async getMediaUrl(instance, data) {
        return this.s3Service.getMediaUrl(instance, data);
    }
}
exports.S3Controller = S3Controller;
