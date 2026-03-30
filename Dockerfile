FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY Backend ./Backend
COPY Frontend ./Frontend

EXPOSE 5000

CMD ["node", "Backend/server.js"]
