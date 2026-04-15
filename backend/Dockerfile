FROM node:20-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install --production=false

COPY src/ ./src/
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/server.js"]
