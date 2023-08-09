FROM node:latest

WORKDIR /app

#Copie les packages dans le workdir
COPY --chown=node:node package*.json ./

#Installe les dependances
RUN npm install -g @nestjs/cli

#Copie tout le repertoire local vers le workdir
COPY --chown=node:node . .

EXPOSE 3000

#Commande a exec lorsque le conteneur est demarre
CMD ["npm", "run", "start"]

#test
