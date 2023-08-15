FROM node:18-alpine

WORKDIR /var/app

RUN apk update
RUN apk upgrade
RUN apk add nano curl git openssh-client bash python3 make gcc g++ libc-dev jq
RUN ln -sf /usr/bin/python3 /usr/bin/python

RUN npm install -g pnpm

ADD package.json original-package.json
RUN jq '{"dependencies": [.dependencies | to_entries | .[] | select(.value != "workspace:*")] | from_entries} + {"devDependecies": [.devDependencies | to_entries | .[] | select(.value != "workspace:*")] | from_entries} + ([to_entries | .[] | select(.key != "dependencies" and .key != "devDependencies")] | from_entries)' original-package.json > package.json

RUN pnpm install
RUN pnpm add @tasenor/common
RUN pnpm add @tasenor/common-node

ADD tsconfig.json .
ADD bin/ bin/
ADD src/ src/
ADD .env.docker .env.local

RUN mkdir src/plugins

CMD ["pnpm", "run", "docker"]
