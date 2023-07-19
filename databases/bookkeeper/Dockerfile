FROM postgres:14.0-alpine

ADD ./docker-entrypoint-initdb.d/* /docker-entrypoint-initdb.d
RUN apk update
RUN apk upgrade
RUN apk add nano curl nodejs npm git openssh python3 make gcc g++ libc-dev
RUN npm install -g yarn
