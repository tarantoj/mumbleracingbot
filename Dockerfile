FROM node:lts AS build

WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .
RUN npm run build

FROM node:lts
WORKDIR /usr/src/app

COPY package.json .
RUN npm install --production
COPY --from=build /usr/src/app/dist dist

CMD ["node", "dist/index.js"]