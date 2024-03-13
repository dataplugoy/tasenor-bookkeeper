FROM node:18-alpine

WORKDIR /var/app

# Install basics.
RUN apk update
RUN apk upgrade

RUN apk add nano curl bash jq git

RUN npm install -g pnpm

ADD package.json original-package.json
RUN jq '{"dependencies": [.dependencies | to_entries | .[] | select(.value != "workspace:*")] | from_entries} + {"devDependecies": [.devDependencies | to_entries | .[] | select(.value != "workspace:*")] | from_entries} + ([to_entries | .[] | select(.key != "dependencies" and .key != "devDependencies")] | from_entries)' original-package.json > package.json

# Only way to reliably show the docs seems to be running full development copy.
# Otherwise class documentation keeps giving 404.
RUN git clone https://github.com/dataplugoy/tasenor-bookkeeper.git
RUN cp package.json /var/app/tasenor-bookkeeper/apps/docs/package.json

WORKDIR /var/app/tasenor-bookkeeper/apps/docs

RUN pnpm install

CMD ["pnpm", "run", "docker"]
