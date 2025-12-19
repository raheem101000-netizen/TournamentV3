ARG NODE_VER=20

# 1. Install dependencies only when needed
FROM node:$NODE_VER AS deps
WORKDIR /home/node
COPY package.json package-lock.json schema.graphql ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 npm ci
COPY . .

WORKDIR /home/node
FROM deps as builder
WORKDIR /home/node
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 npm run build

FROM node:$NODE_VER-slim
WORKDIR /home/node
COPY --from=deps /home/node/node_modules /home/node/node_modules
COPY --from=deps /home/node/package.json /home/node/package.json
COPY --from=deps /home/node/schema.graphql /home/node/schema.graphql
COPY --from=builder /home/node/lib /home/node/lib
ENV PORT=8080
ENV PATH="/home/node/node_modules/.bin:$PATH"
CMD ["node", "lib/index.js"]
