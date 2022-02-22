FROM node:12.16-buster-slim

ENV NAME climatechange
ENV USER microservice

RUN apt-get update -y && apt-get upgrade -y && \
    apt-get install -y bash

RUN addgroup $USER && useradd -ms /bin/bash $USER -g $USER

RUN mkdir -p /opt/$NAME
COPY package.json /opt/$NAME/package.json
COPY yarn.lock /opt/$NAME/yarn.lock
RUN cd /opt/$NAME && yarn install

COPY entrypoint.sh /opt/$NAME/entrypoint.sh
COPY config /opt/$NAME/config

WORKDIR /opt/$NAME

COPY --chown=$USER:$USER ./app /opt/$NAME/app

USER $USER

ENTRYPOINT ["./entrypoint.sh"]