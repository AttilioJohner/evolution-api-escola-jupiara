import { PrismaRepository } from '@api/repository/repository.service';
export declare class AuthService {
    private readonly prismaRepository;
    constructor(prismaRepository: PrismaRepository);
    checkDuplicateToken(token: string): Promise<boolean>;
}
