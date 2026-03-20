FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN mkdir -p /app/storage/originals /app/storage/transformed

EXPOSE 3001

CMD ["npm", "run", "dev"]
