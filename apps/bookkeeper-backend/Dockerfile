FROM node:18-alpine

WORKDIR /var/app

RUN apk update
RUN apk upgrade
RUN apk add nano curl git openssh-client bash python3 make gcc g++ libc-dev
RUN ln -sf /usr/bin/python3 /usr/bin/python

RUN npm install -g pnpm

# ADD ssh /root/.ssh
# RUN chmod 600 /root/.ssh/id_rsa

# TODO: Need to create different version of package.json
ADD package.json .
ADD . .

RUN pnpm install

# TODO: Need separate script for production?
CMD ["pnpm", "run", "dev"]
