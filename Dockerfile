FROM node:20-alpine

RUN addgroup app && adduser -S -G app app

USER app

WORKDIR /app

COPY package*.json ./

USER root

RUN chown -R app:app .

USER app

ADD configs/config.example.json configs/config.json
ADD configs/languages.example.json configs/languages.json
ADD databases/aiResponses.example.json databases/aiResponses.json
ADD databases/debtsDb.example.json databases/debtsDb.json
ADD databases/timeoutDb.example.json databases/timeoutDb.json

RUN npm install

COPY . .

RUN npm run commands

CMD npm run start