FROM node:5.2.0
MAINTAINER nukr <nukrs.w@gmail.com>

COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

RUN npm install pm2 -g

WORKDIR /opt/app
COPY . /opt/app

CMD ["./bin/start"]
