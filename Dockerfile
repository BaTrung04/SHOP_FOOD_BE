FROM node:18

WORKDIR /SHOP_FOOD_BE

RUN apt-get update
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE ${PORT}

CMD ["npm", "start"]