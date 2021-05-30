FROM klakegg/hugo

RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*
RUN apk add git openssh

COPY . /root/projects/livemart-vex-hugo
WORKDIR /root/projects/livemart-vex-hugo

ENTRYPOINT ["hugo", "server", "--themesDir", "../.."]
