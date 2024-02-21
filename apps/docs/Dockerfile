FROM node:18-alpine

# Install basics.
RUN apk update
RUN apk upgrade

RUN apk add nano curl bash jq

RUN npm install -g pnpm

ADD package.json original-package.json
RUN jq '{"dependencies": [.dependencies | to_entries | .[] | select(.value != "workspace:*")] | from_entries} + {"devDependecies": [.devDependencies | to_entries | .[] | select(.value != "workspace:*")] | from_entries} + ([to_entries | .[] | select(.key != "dependencies" and .key != "devDependencies")] | from_entries)' original-package.json > package.json


ADD babel.config.js  .
ADD docs/ docs/
ADD docusaurus.config.ts .
ADD sidebars.ts .
ADD src/ src/
ADD static/ static/
ADD tsconfig.json .

RUN pnpm install

CMD ["pnpm", "run", "docker"]
