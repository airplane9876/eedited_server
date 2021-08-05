/* eslint-disable @typescript-eslint/no-empty-function */
import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';
import { WritableDraft } from 'immer/dist/internal';
import {
    videoAPIListProp, videoAPIProp, videoAPIUploadProp, videoAPIUserProp,
} from '../../lib/api/video';
import {
    videoActionType,
    videoFailureType, videoListFailureType, videoStateType, videoSuccessType, videoUploadFailureType, videoUploadSuccessType, viedoListSuccessType,
} from './videoType';

const initialState: videoStateType = {
    video: null,
    videoList: null,
    getVideoError: null,
    videoUploadError: null,
    videoUserUpload: null,
    videoUserUploadError: null,
};
type videoSliceType = Slice<videoStateType, {
    videoClear(state: WritableDraft<videoStateType>): void;
    video(state: WritableDraft<videoStateType>, action: PayloadAction<videoAPIProp>): void;
    videoSuccess(state: WritableDraft<videoStateType>, action: PayloadAction<videoSuccessType>): void;
    videoFailure(state: WritableDraft<videoStateType>, action: PayloadAction<videoFailureType>): void;
    videoList(state: WritableDraft<videoStateType>, action: PayloadAction<videoAPIListProp>): void,
    videoListSuccess(state: WritableDraft<videoStateType>, action: PayloadAction<viedoListSuccessType>): void,
    videoListFailure(state: WritableDraft<videoStateType>, action: PayloadAction<videoListFailureType>): void,
    videoUpload(state: WritableDraft<videoStateType>, action: PayloadAction<videoAPIUploadProp>): void,
    videoUploadSuccess(state: WritableDraft<videoStateType>, action: PayloadAction<videoUploadSuccessType>): void,
    videoUploadFailure(state: WritableDraft<videoStateType>, action: PayloadAction<videoUploadFailureType>): void;
    videoUserUploaded(state: WritableDraft<videoStateType>, action: PayloadAction<videoAPIUserProp>): void
    videoUserUploadedSuccess(state: WritableDraft<videoStateType>, action: PayloadAction<viedoListSuccessType>): void
    videoUserUploadedFailure(state: WritableDraft<videoStateType>, action: PayloadAction<videoListFailureType>): void
}, 'VIDEO'>

const videoSlice: videoSliceType = createSlice({
    name: 'VIDEO',
    initialState,
    reducers: {
        videoClear(state: WritableDraft<videoStateType>) {
            state.videoList = null;
            state.video = null;
            state.getVideoError = null;
            state.videoUploadError = null;
            state.videoUserUpload = null;
            state.videoUserUploadError = null;
        },

        video(state: WritableDraft<videoStateType>, action: PayloadAction<videoAPIProp>) {},
        videoSuccess(state: WritableDraft<videoStateType>, action: PayloadAction<videoSuccessType>) {
            state.video = action.payload;
        },
        videoFailure(state: WritableDraft<videoStateType>, action: PayloadAction<videoFailureType>) {
            state.getVideoError = action.payload;
        },

        videoList(state: WritableDraft<videoStateType>, action: PayloadAction<videoAPIListProp>) {},
        videoListSuccess(state: WritableDraft<videoStateType>, action: PayloadAction<viedoListSuccessType>) {
            if (state.videoList == null) {
                state.videoList = { videos: action.payload.videos };
            }
            else {
                state.videoList.videos = state.videoList.videos.concat(action.payload.videos);
            }
        },
        videoListFailure(state: WritableDraft<videoStateType>, action: PayloadAction<videoListFailureType>) {
            state.getVideoError = action.payload;
        },

        videoUpload(state: WritableDraft<videoStateType>, action: PayloadAction<videoAPIUploadProp>) {},
        videoUploadSuccess(state: WritableDraft<videoStateType>, action: PayloadAction<videoUploadSuccessType>) {},
        videoUploadFailure(state: WritableDraft<videoStateType>, action: PayloadAction<videoUploadFailureType>) {
            state.videoUploadError = action.payload;
        },

        videoUserUploaded(state: WritableDraft<videoStateType>, action: PayloadAction<videoAPIUserProp>) {},
        videoUserUploadedSuccess(state: WritableDraft<videoStateType>, action: PayloadAction<viedoListSuccessType>) {
            state.videoUserUpload = action.payload;
        },
        videoUserUploadedFailure(state: WritableDraft<videoStateType>, action: PayloadAction<videoListFailureType>) {
            state.videoUserUploadError = action.payload;
        },

    },
});

export const VIDEO: string = videoSlice.name;
export default videoSlice.reducer;
export const videoAction: videoActionType = videoSlice.actions;
