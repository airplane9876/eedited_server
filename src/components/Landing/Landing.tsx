import React from 'react';
import BaseTemplate from '../BaseTemplate/BaseTemplate';
import Description from './Description/Description';
import VideoGrid from './VideoGrid/VideoGrid';

const Landing: React.FC = () => (
    <BaseTemplate>
        <Description />
        <VideoGrid />
    </BaseTemplate>
);

export default Landing;
