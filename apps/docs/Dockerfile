FROM node:18-alpine

WORKDIR /var/app

# Install basics.
RUN apk update
RUN apk upgrade

RUN apk add nano curl bash jq

RUN npm install -g pnpm

ADD package.json original-package.json
RUN jq '{"dependencies": [.dependencies | to_entries | .[] | select(.value != "workspace:*")] | from_entries} + {"devDependecies": [.devDependencies | to_entries | .[] | select(.value != "workspace:*")] | from_entries} + ([to_entries | .[] | select(.key != "dependencies" and .key != "devDependencies")] | from_entries)' original-package.json > package.json

RUN pnpm install

RUN pnpm add @tasenor/common
RUN pnpm add @tasenor/common-node
RUN pnpm add @tasenor/common-ui

RUN mkdir /packages
RUN ln -s /var/app/node_modules/@tasenor/common /packages/tasenor-common
RUN ln -s /var/app/node_modules/@tasenor/common-node /packages/tasenor-common-node
RUN ln -s /var/app/node_modules/@tasenor/common-ui /packages/tasenor-common-ui

ADD babel.config.js  .
ADD docs/ docs/
ADD docusaurus.config.ts .
ADD sidebars.ts .
ADD src/ src/
ADD public/ public/
# For some reason this needs to be in /
RUN echo '{}' > /tsconfig.json

CMD ["pnpm", "run", "docker"]
