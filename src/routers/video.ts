import { Request, Response, Router } from 'express';
import { User, Video, VideoLiker } from '@prisma/client';
import AWS from 'aws-sdk';
import { isLoggedIn, isNotBlock } from '../middlewares/auth';
import DB from '../db';

const router: Router = Router();
const take: number = 20;

router.get('/', async (req: Request, res: Response) => {
    const category: string = req.query.category as string;
    const sort: string = req.query.sort as string;
    const pageStr: string = req.query.page as string;
    const { user }: Request = req;
    try {
        const pageNum: number = Number(pageStr);
        if (Number.isNaN(pageNum)) {
            return res.status(400).json({
                info: `/video/${pageStr} not valid input`,
            });
        }
        let videos: (Video&{WhatVideoUpload?: {liker: string}[], User: {nickname: string, profilePicture: string}})[];
        if (user) {
            if (!category) {
                if (sort === 'latest') {
                    videos = await DB.prisma.video.findMany({
                        where: { deletedAt: null },
                        skip: (pageNum - 1) * take,
                        orderBy: { createdAt: 'desc' },
                        take,
                        include: {
                            WhatVideoUpload: {
                                where: {
                                    liker: user.userId,
                                    deletedAt: null,
                                },
                                select: {
                                    liker: true,
                                },
                            },
                            User: {
                                select: {
                                    nickname: true,
                                    profilePicture: true,
                                },
                            },
                        },
                    });
                }
                else {
                    videos = await DB.prisma.video.findMany({
                        where: { deletedAt: null },
                        skip: (pageNum - 1) * take,
                        orderBy: { likeCnt: 'desc' },
                        take,
                        include: {
                            WhatVideoUpload: {
                                where: {
                                    liker: user.userId,
                                    deletedAt: null,
                                },
                                select: {
                                    liker: true,
                                },
                            },
                            User: {
                                select: {
                                    nickname: true,
                                    profilePicture: true,
                                },
                            },
                        },
                    });
                }
            }
            else {
                // eslint-disable-next-line no-lonely-if
                if (sort === 'latest') {
                    videos = await DB.prisma.video.findMany({
                        where: { deletedAt: null, category },
                        skip: (pageNum - 1) * take,
                        orderBy: { createdAt: 'desc' },
                        take,
                        include: {
                            WhatVideoUpload: {
                                where: {
                                    liker: user.userId,
                                    deletedAt: null,
                                },
                                select: {
                                    liker: true,
                                },
                            },
                            User: {
                                select: {
                                    nickname: true,
                                    profilePicture: true,
                                },
                            },
                        },
                    });
                }
                else {
                    videos = await DB.prisma.video.findMany({
                        where: { deletedAt: null, category },
                        skip: (pageNum - 1) * take,
                        orderBy: { likeCnt: 'desc' },
                        take,
                        include: {
                            WhatVideoUpload: {
                                where: {
                                    liker: user.userId,
                                    deletedAt: null,
                                },
                                select: {
                                    liker: true,
                                },
                            },
                            User: {
                                select: {
                                    nickname: true,
                                    profilePicture: true,
                                },
                            },
                        },
                    });
                }
            }
        }
        else {
            // eslint-disable-next-line no-lonely-if
            if (!category) {
                if (sort === 'latest') {
                    videos = await DB.prisma.video.findMany({
                        where: { deletedAt: null },
                        skip: (pageNum - 1) * take,
                        orderBy: { createdAt: 'desc' },
                        take,
                        include: {
                            User: {
                                select: {
                                    nickname: true,
                                    profilePicture: true,
                                },
                            },
                        },
                    });
                }
                else {
                    videos = await DB.prisma.video.findMany({
                        where: { deletedAt: null },
                        skip: (pageNum - 1) * take,
                        orderBy: { likeCnt: 'desc' },
                        take,
                        include: {
                            User: {
                                select: {
                                    nickname: true,
                                    profilePicture: true,
                                },
                            },
                        },
                    });
                }
            }
            else {
                // eslint-disable-next-line no-lonely-if
                if (sort === 'latest') {
                    videos = await DB.prisma.video.findMany({
                        where: { deletedAt: null, category },
                        skip: (pageNum - 1) * take,
                        orderBy: { createdAt: 'desc' },
                        take,
                        include: {
                            User: {
                                select: {
                                    nickname: true,
                                    profilePicture: true,
                                },
                            },
                        },
                    });
                }
                else {
                    videos = await DB.prisma.video.findMany({
                        where: { deletedAt: null, category },
                        skip: (pageNum - 1) * take,
                        orderBy: { likeCnt: 'desc' },
                        take,
                        include: {
                            User: {
                                select: {
                                    nickname: true,
                                    profilePicture: true,
                                },
                            },
                        },
                    });
                }
            }
        }
        return res.status(200).json({
            videos,
        });
    }
    catch (err) {
        return res.status(500).json({
            info: `/video/${pageStr} router error`,
        });
    }
});

router.post('/upload', isLoggedIn, isNotBlock, async (req: Request, res: Response) => {
    const { title, description, url, thumbnail, category, tags }: Video&{tags: string[]} = req.body;
    const user: Express.User = req.user as Express.User;
    try {
        const uploadedVideo: Video = await DB.prisma.video.create({
            data: {
                title,
                description,
                url,
                thumbnail,
                category,
                uploader: user.userId,
            },
        });
        if (tags) {
            const tagData: {
                uploader: string;
                videoId: string;
                tagName: string;
            }[] = tags.map((tag: string) => ({
                uploader: uploadedVideo.uploader,
                videoId: uploadedVideo.id,
                tagName: tag,
            }));
            await DB.prisma.videoTag.createMany({
                data: tagData,
                skipDuplicates: true,
            });
        }
        return res.status(200).json({});
    }
    catch (err) {
        return res.status(500).json({
            info: '/video/upload router error',
        });
    }
});
router.patch('/upload', isLoggedIn, isNotBlock, async (req: Request, res: Response) => {
    const { id, title, description, url, thumbnail, category, tags }: Video&{tags: string[]} = req.body;
    const user: Express.User = req.user as Express.User;
    try {
        const uploadedVideo: Video = await DB.prisma.video.update({
            where: {
                uploader_id: {
                    id,
                    uploader: user.userId,
                },
            },
            data: {
                title,
                description,
                url,
                thumbnail,
                category,
                uploader: user.userId,
            },
        });
        await DB.prisma.videoTag.deleteMany({
            where: {
                WhatVideoUploadTag: {
                    id,
                },
            },
        });
        if (tags) {
            const tagData: {
                uploader: string;
                videoId: string;
                tagName: string;
            }[] = tags.map((tag: string) => ({
                uploader: uploadedVideo.uploader,
                videoId: uploadedVideo.id,
                tagName: tag,
            }));
            await DB.prisma.videoTag.createMany({
                data: tagData,
                skipDuplicates: true,
            });
        }
        return res.status(200).json({});
    }
    catch (err) {
        return res.status(500).json({
            info: '/video/upload router error',
        });
    }
});

router.post('/getTags', isLoggedIn, isNotBlock, (req: Request, res: Response) => {
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
    const { user }: Request = req;
    try {
        let video: (Video & { User: User & { followTo: { followerId: string; }[]; }; WhatVideoUploadTag: { tagName: string; }[]; WhatVideoUpload: { liker: string; }[]; }) | (Video & { User: { nickname: string, profilePicture: string }; WhatVideoUploadTag: { tagName: string; }[]; }) | null;
        if (user) {
            video = await DB.prisma.video.findFirst({
                where: {
                    id: videoId,
                    deletedAt: null,
                },
                include: {
                    WhatVideoUpload: {
                        where: {
                            liker: user.userId,
                            deletedAt: null,
                        },
                        select: {
                            liker: true,
                        },
                    },
                    User: {
                        select: {
                            nickname: true,
                            profilePicture: true,
                            followTo: {
                                where: {
                                    followerId: user.userId,
                                    deletedAt: null,
                                },
                                select: {
                                    followerId: true,
                                },
                            },
                        },
                    },
                    WhatVideoUploadTag: {
                        select: {
                            tagName: true,
                        },
                    },
                },
            });
        }
        else {
            video = await DB.prisma.video.findFirst({
                where: {
                    id: videoId,
                    deletedAt: null,
                },
                include: {
                    User: {
                        select: {
                            nickname: true,
                            profilePicture: true,
                        },
                    },
                    WhatVideoUploadTag: {
                        select: {
                            tagName: true,
                        },
                    },
                },
            });
        }
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
        return res.status(200).json({
            ...video,
        });
    }
    catch (err) {
        return res.status(500).json({
            info: '/video/upload router error',
        });
    }
});

router.patch('/:videoId/like', isLoggedIn, isNotBlock, async (req: Request, res: Response) => {
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

router.get('/:videoId/delete', isLoggedIn, isNotBlock, async (req: Request, res: Response) => {
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
    const { user }: Request = req;
    const pageStr: string = req.query.page as string;
    try {
        const pageNum: number = Number(pageStr);
        if (Number.isNaN(pageNum)) {
            return res.status(400).json({
                info: `/video/${pageStr} not valid input`,
            });
        }
        let videos: (Video&{WhatVideoUpload?: {liker: string}[], User: {nickname: string, profilePicture: string}})[];
        if (user) {
            videos = await DB.prisma.video.findMany({
                where: {
                    uploader: userId,
                    deletedAt: null,
                },
                skip: (pageNum - 1) * take,
                take,
                include: {
                    WhatVideoUpload: {
                        where: {
                            liker: user.userId,
                            deletedAt: null,
                        },
                        select: {
                            liker: true,
                        },
                    },
                    User: {
                        select: {
                            nickname: true,
                            profilePicture: true,
                        },
                    },
                },
            });
        }
        else {
            videos = await DB.prisma.video.findMany({
                where: {
                    uploader: userId,
                    deletedAt: null,
                },
                skip: (pageNum - 1) * take,
                take,
                include: {
                    User: {
                        select: {
                            nickname: true,
                            profilePicture: true,
                        },
                    },
                },
            });
        }
        return res.status(200).json({
            videos,
        });
    }
    catch (err) {
        return res.status(500).json({
            info: '/video/:userId/list router error',
        });
    }
});

export default router;
