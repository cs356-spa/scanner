FROM node:14-buster-slim as build
WORKDIR /app
COPY package.json /app
COPY yarn.lock /app
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN yarn --frozen-lockfile
COPY src /app/src
COPY extensions /app/extensions
COPY tsconfig.json /app
COPY webpack.config.js /app
RUN yarn build

FROM node:14-buster-slim as data
RUN apt-get update && apt-get install -y wget
RUN wget https://downloads.majestic.com/majestic_million.csv -O million.csv

FROM node:14-buster-slim

# Puppeteer setup from https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# If running Docker >= 1.13.0 use docker run's --init arg to reap zombie processes, otherwise
# uncomment the following lines to have `dumb-init` as PID 1
# ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
# RUN chmod +x /usr/local/bin/dumb-init
# ENTRYPOINT ["dumb-init", "--"]

# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome-stable'})
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install puppeteer so it's available in the container.
WORKDIR /app
RUN cd /app && npm i puppeteer \
    # Add user so we don't need --no-sandbox.
    # same layer as npm install to keep re-chowned files from using up several hundred MBs more space
    && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser


# RUN sysctl -w kernel.unprivileged_userns_clone=1

WORKDIR /app
COPY --from=build /app/dist  /app/dist/
COPY --from=build /app/extensions /app/extensions/
COPY --from=data million.csv /tmp/
RUN ls /tmp/
# RUN touch output.json && chmod 777 output.json
CMD node dist/worker.bundle.js