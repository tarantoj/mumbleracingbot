FROM node:latest AS build

WORKDIR /usr/src/app

COPY package.json .
RUN npm install

COPY . .
RUN npm build

FROM node:latest
WORKDIR /usr/src/app

COPY package.json .
RUN npm install --production
COPY --from=build /usr/src/app/dist dist

CMD ["node", "dist/index.js"]