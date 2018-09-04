FROM node:8.11.4-alpine
ADD . /code
WORKDIR /code
RUN npm install
CMD ["node", "server.js"]