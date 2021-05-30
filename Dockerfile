FROM klakegg/hugo

COPY . /root/projects/livemart-vex-hugo
WORKDIR /root/projects/livemart-vex-hugo/exampleSite

ENTRYPOINT ["hugo", "server", "--themesDir", "../.."]
