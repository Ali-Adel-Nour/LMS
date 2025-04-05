FROM node:18-alpine

WORKDIR /usr/src/app

# Install required dependencies for bcrypt
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Install dependencies and rebuild bcrypt
RUN npm install
RUN npm rebuild bcrypt --build-from-source

COPY . .

EXPOSE 4000

CMD ["npm", "start"]