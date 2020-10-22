FROM node:14-buster-slim as build
WORKDIR /app
COPY package.json /app
COPY yarn.lock /app
RUN yarn
COPY . /app
RUN yarn build

FROM buildkite/puppeteer
WORKDIR /app
COPY --from=build /app/package.json /app/yarn.lock /app/.build /app/
CMD yarn run start-prod