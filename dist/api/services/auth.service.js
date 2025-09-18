"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const _exceptions_1 = require("@exceptions");
class AuthService {
    constructor(prismaRepository) {
        this.prismaRepository = prismaRepository;
    }
    async checkDuplicateToken(token) {
        if (!token) {
            return true;
        }
        const instances = await this.prismaRepository.instance.findMany({
            where: { token },
        });
        if (instances.length > 0) {
            throw new _exceptions_1.BadRequestException('Token already exists');
        }
        return true;
    }
}
exports.AuthService = AuthService;
