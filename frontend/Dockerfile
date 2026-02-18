FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm ci

COPY . /app
RUN npm run build

CMD ["sh", "-c", "npm run start -- -H 0.0.0.0 -p ${PORT:-3000}"]
