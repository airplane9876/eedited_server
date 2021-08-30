import { Request, Response, Router } from 'express';
import { User, Video, VideoLiker, VideoTag } from '@prisma/client';
import AWS from 'aws-sdk';
import { isLoggedIn } from '../middlewares/auth';
import DB from '../db';

const router: Router = Router();
const take: number = 20;

router.get('/', async (req: Request, res: Response) => {
    const pageStr: string = req.query.page as string;
    try {
        const pageNum: number = Number(pageStr);
        if (Number.isNaN(pageNum)) {
            return res.status(400).json({
                info: `/video/${pageStr} not valid input`,
            });
        }
        const videos: Video[] = await DB.prisma.video.findMany({
            where: { deletedAt: null },
            skip: (pageNum - 1) * take,
            take,
        });
        const videoPromise: Promise<User|null>[] = videos.map((video: Video): Promise<User|null> => DB.prisma.user.findFirst({ where: { userId: video.uploader, deletedAt: null } }));
        const users: (User|null)[] = await Promise.all(videoPromise);
        if (users.filter((user: User | null) => user === null).length > 0) {
            return res.status(400).json({
                info: `/video/${pageStr} : cannot find User`,
            });
        }
        interface VideoWithNicknameType extends Video{
            nickname?: string
        }
        const videoWithNickName: VideoWithNicknameType[] = videos.map((video: Video, idx: number) => ({
            nickname: users[idx]?.nickname,
            ...video,
        }));
        return res.status(200).json({
            videos: videoWithNickName,
        });
    }
    catch (err) {
        return res.status(500).json({
            info: `/video/${pageStr} router error`,
        });
    }
});

router.get('/sort/latest', async (req: Request, res: Response) => {
    const pageStr: string = req.query.page as string;
    try {
        const pageNum: number = Number(pageStr);
        if (Number.isNaN(pageNum)) {
            return res.status(400).json({
                info: `/video/${pageStr} not valid input`,
            });
        }
        const videos: Video[] = await DB.prisma.video.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            skip: (pageNum - 1) * take,
            take,
        });
        const videoPromise: Promise<User|null>[] = videos.map((video: Video): Promise<User|null> => DB.prisma.user.findFirst({ where: { userId: video.uploader, deletedAt: null } }));
        const users: (User|null)[] = await Promise.all(videoPromise);
        if (users.filter((user: User | null) => user === null).length > 0) {
            return res.status(400).json({
                info: `/video/${pageStr} : cannot find User`,
            });
        }
        interface VideoWithNicknameType extends Video{
            nickname?: string
        }
        const videoWithNickName: VideoWithNicknameType[] = videos.map((video: Video, idx: number) => ({
            nickname: users[idx]?.nickname,
            ...video,
        }));
        return res.status(200).json({
            videos: videoWithNickName,
        });
    }
    catch (err) {
        return res.status(500).json({
            info: '/video/sort/latest router error',
        });
    }
});

router.get('/sort/thumbup', async (req: Request, res: Response) => {
    const pageStr: string = req.query.page as string;
    try {
        const pageNum: number = Number(pageStr);
        if (Number.isNaN(pageNum)) {
            return res.status(400).json({
                info: `/video/${pageStr} not valid input`,
            });
        }
        const videos: Video[] = await DB.prisma.video.findMany({
            where: { deletedAt: null },
            orderBy: { likeCnt: 'desc' },
            skip: (pageNum - 1) * take,
            take,
        });
        const videoPromise: Promise<User|null>[] = videos.map((video: Video): Promise<User|null> => DB.prisma.user.findFirst({ where: { userId: video.uploader, deletedAt: null } }));
        const users: (User|null)[] = await Promise.all(videoPromise);
        if (users.filter((user: User | null) => user === null).length > 0) {
            return res.status(400).json({
                info: `/video/${pageStr} : cannot find User`,
            });
        }
        interface VideoWithNicknameType extends Video{
            nickname?: string
        }
        const videoWithNickName: VideoWithNicknameType[] = videos.map((video: Video, idx: number) => ({
            nickname: users[idx]?.nickname,
            ...video,
        }));
        return res.status(200).json({
            videos: videoWithNickName,
        });
    }
    catch (err) {
        return res.status(500).json({
            info: '/video/sort/thumbup router error',
        });
    }
});

router.post('/upload', isLoggedIn, async (req: Request, res: Response) => {
    const { title, discription, url, thumbnail, tags }: Video&{tags: string[]} = req.body;
    const user: Express.User = req.user as Express.User;
    try {
        const uploadedVideo: Video = await DB.prisma.video.create({
            data: {
                title,
                discription,
                url,
                thumbnail,
                uploader: user.userId,
            },
        });
        const tagPromise: Promise<VideoTag|null>[] = tags.map((tag: string) => DB.prisma.videoTag.create({
            data: {
                uploader: uploadedVideo.uploader,
                videoId: uploadedVideo.id,
                tagName: tag,
            },
        }));
        Promise.all(tagPromise);
        return res.status(200).json({});
    }
    catch (err) {
        return res.status(500).json({
            info: '/video/upload router error',
        });
    }
});

router.post('/getTags', isLoggedIn, (req: Request, res: Response) => {
    const { thumbnail }: Video = req.body;
    try {
        AWS.config.update({
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION,
        });
        const bucket: string = 'eedited-thumbnail';
        const client: AWS.Rekognition = new AWS.Rekognition();
        const params: AWS.Rekognition.Types.DetectLabelsRequest = {
            Image: {
                S3Object: {
                    Bucket: bucket,
                    Name: thumbnail,
                },
            },
            MaxLabels: 10,
        };
        client.detectLabels(params, (err: AWS.AWSError, response: AWS.Rekognition.Types.DetectLabelsResponse) => {
            if (err) {
                // return res.status(500).json({
                //     info: '/video/getTags client.detectLabels func error',
                // });
                return res.status(500).json({
                    info: '/video/upload router detectLabels callback function error',
                });
            }
            if (response.Labels === undefined) {
                return res.status(500).json({
                    info: '/video/upload router error',
                });
            }
            const tags: (string)[] = response.Labels.map((label: AWS.Rekognition.Types.Label) => {
                if (label.Name) return label.Name;
                return '';
            }).filter((name: string) => name !== '');
            return res.status(200).json({
                tags,
            });
        });
        return res;
    }
    catch (err) {
        return res.status(500).json({
            info: '/video/getTags router error',
        });
    }
});

router.get('/:videoId', async (req: Request, res: Response) => {
    const { videoId }: typeof req.params = req.params;
    try {
        const video: (Video | null) = await DB.prisma.video.findFirst({
            where: {
                id: videoId,
                deletedAt: null,
            },
        });
        if (!video || video.deletedAt !== null) {
            return res.status(404).json({
                info: '/video/:videoId not exists video',
            });
        }
        await DB.prisma.video.update({
            where: {
                uploader_id: {
                    id: videoId,
                    uploader: video.uploader,
                },
            },
            data: {
                viewCnt: { increment: 1 },
            },
        });
        const user: (User | null) = await DB.prisma.user.findFirst({
            where: {
                userId: video.uploader,
                deletedAt: null,
            },
        });
        const tags: (VideoTag|null)[] = await DB.prisma.videoTag.findMany({
            where: {
                uploader: video.uploader,
                videoId: video.id,
            },
        });
        const returnTag: ({name: string}|null)[] = tags.map((tag: VideoTag|null) => {
            if (tag !== null) return { name: tag.tagName };
            return null;
        });
        return res.status(200).json({
            video: {
                ...video,
                nickname: user?.nickname,
                videoTag: returnTag.filter((tag: {name: string}|null) => (tag !== null)),
            },
        });
    }
    catch (err) {
        return res.status(500).json({
            info: '/video/upload router error',
        });
    }
});

router.patch('/:videoId/like', isLoggedIn, async (req: Request, res: Response) => {
    const { videoId }: typeof req.params = req.params;
    const user: Express.User = req.user as Express.User;
    try {
        const video: (Video | null) = await DB.prisma.video.findFirst({
            where: {
                id: videoId,
                deletedAt: null,
            },
        });
        if (video == null) {
            return res.status(404).json({
                info: '/:videoId/like user undefind or video not exists',
            });
        }
        const videoLiker: (VideoLiker | null) = await DB.prisma.videoLiker.findFirst({
            where: {
                videoId,
                liker: user.userId,
                uploader: video.uploader,
            },
        });
        if (videoLiker) {
            if (videoLiker.deletedAt !== null) {
                await DB.prisma.videoLiker.update({
                    where: {
                        liker_uploader_videoId: {
                            videoId,
                            liker: user.userId,
                            uploader: video.uploader,
                        },
                    },
                    data: {
                        deletedAt: null,
                    },
                });
            }
            else {
                await DB.prisma.videoLiker.update({
                    where: {
                        liker_uploader_videoId: {
                            videoId,
                            liker: user.userId,
                            uploader: video.uploader,
                        },
                    },
                    data: {
                        deletedAt: new Date(),
                    },
                });
            }
        }
        else {
            await DB.prisma.videoLiker.create({
                data: {
                    videoId,
                    liker: user.userId,
                    uploader: video.uploader,
                },
            });
        }
        return res.status(200).json({});
    }
    catch (err) {
        return res.status(500).json({
            info: '/:videoId/like router error',
        });
    }
});

router.get('/:videoId/delete', isLoggedIn, async (req: Request, res: Response) => {
    const { videoId }: typeof req.params = req.params;
    const user: Express.User = req.user as Express.User;
    try {
        const video: Video | null = await DB.prisma.video.findFirst({
            where: {
                id: videoId,
                deletedAt: null,
            },
        });
        if (!video || video.deletedAt !== null || video.uploader !== user.userId) {
            return res.status(403).json({
                info: '/video/delete/:videoId not exists video or not permissioned user',
            });
        }
        await DB.prisma.video.delete({
            where: {
                uploader_id: {
                    uploader: video.uploader,
                    id: video.id,
                },
            },
        });
        return res.status(200).json({});
    }
    catch (err) {
        return res.status(500).json({
            info: '/video/:videoId/delete router error',
        });
    }
});

router.get('/:userId/list', async (req: Request, res: Response) => {
    const { userId }: typeof req.params = req.params;
    const pageStr: string = req.query.page as string;
    try {
        const pageNum: number = Number(pageStr);
        if (Number.isNaN(pageNum)) {
            return res.status(400).json({
                info: `/video/${pageStr} not valid input`,
            });
        }
        const videos: Video[] = await DB.prisma.video.findMany({
            where: {
                uploader: userId,
                deletedAt: null,
            },
            skip: (pageNum - 1) * take,
            take,
        });
        const videoPromise: Promise<User|null>[] = videos.map((video: Video): Promise<User|null> => DB.prisma.user.findFirst({ where: { userId: video.uploader, deletedAt: null } }));
        const users: (User|null)[] = await Promise.all(videoPromise);
        if (users.filter((user: User | null) => user === null).length > 0) {
            return res.status(400).json({
                info: `/video/${pageStr} : cannot find User`,
            });
        }
        interface VideoWithNicknameType extends Video{
            nickname?: string
        }
        const videoWithNickName: VideoWithNicknameType[] = videos.map((video: Video, idx: number) => ({
            nickname: users[idx]?.nickname,
            ...video,
        }));
        return res.status(200).json({
            videos: videoWithNickName,
        });
    }
    catch (err) {
        return res.status(500).json({
            info: '/video/:userId/list router error',
        });
    }
});

export default router;
