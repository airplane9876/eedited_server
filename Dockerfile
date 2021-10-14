#builder
FROM node:14.16.1 as Builder
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max_old_space_size=8192

# ARG does not go in the build image.
ARG REACT_APP_PROD_API_URL
ARG REACT_APP_S3_ACCESS_KEY_ID
ARG REACT_APP_S3_SECRET_ACCESS_KEY
ARG REACT_APP_S3_REGION
ARG REACT_APP_S3_BUCKET_NAME
ARG REACT_APP_S3_BASE_URL

RUN mkdir -p /eedited
WORKDIR /eedited
ADD . /eedited

ENV REACT_APP_PROD_API_URL=${REACT_APP_PROD_API_URL} \
    REACT_APP_S3_ACCESS_KEY_ID=${REACT_APP_S3_ACCESS_KEY_ID} \
    REACT_APP_S3_SECRET_ACCESS_KEY=${REACT_APP_S3_SECRET_ACCESS_KEY} \
    REACT_APP_S3_REGION=${REACT_APP_S3_REGION} \
    REACT_APP_S3_BUCKET_NAME=${REACT_APP_S3_BUCKET_NAME} \
    REACT_APP_S3_BASE_URL=${REACT_APP_S3_BASE_URL}

RUN npm install
RUN npm run build


#production
FROM nginx
RUN mkdir /app
WORKDIR /app
RUN mkdir ./build
COPY --from=Builder /eedited/build ./build/
RUN rm /etc/nginx/conf.d/default.conf
COPY ./nginx.conf /etc/nginx/conf.d

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
