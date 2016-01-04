FROM node:5.2.0
MAINTAINER nukr <nukrs.w@gmail.com>

COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

WORKDIR /opt/app
COPY . /opt/app
CMD ["node", "babel-register.js"]
