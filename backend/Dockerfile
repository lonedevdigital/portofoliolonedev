FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY data ./data

ENV HOST=0.0.0.0
ENV PORT=3001
ENV DATA_FILE=/data/db.json

VOLUME ["/data"]
EXPOSE 3001

CMD ["npm", "run", "start"]
