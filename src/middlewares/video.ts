import { Request, Response, NextFunction } from 'express';
import { PrismaClient, User, Video } from '@prisma/client';

export const videoUploaded: expressMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const prisma: PrismaClient = new PrismaClient();
    const { uploader }: Video = req.body;

    try {
        await prisma.user.update({
            where: { userId: uploader },
            data: { uploadVideoCnt: { increment: 1 } },
        });
        return res.redirect('/');
    }
    catch (err) {
        return next(err);
    }
};
