FROM node:24-alpine AS frontendbuilder
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN cd /app/ui && pnpm install   && CI=false pnpm build && cd ..

FROM golang:1.25-alpine AS binarybuilder
RUN apk --no-cache --no-progress add  git
WORKDIR /app
COPY --from=frontendbuilder /app/ /app/
RUN cd /app && ls -la && go mod tidy && go build .


FROM alpine:latest
ENV TZ="Asia/Shanghai"
RUN apk --no-cache --no-progress add \
    ca-certificates \
    tzdata && \
    cp "/usr/share/zoneinfo/$TZ" /etc/localtime && \
    echo "$TZ" >  /etc/timezone
WORKDIR /app
COPY --from=binarybuilder /app/nav /app/

VOLUME ["/app/data"]
EXPOSE 6412
ENTRYPOINT [ "/app/nav" ]