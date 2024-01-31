#TRANSCENDENCE

School Project 42: (in a group - final project)

##Creation of a full stack website in SPA whose aim is to be able to exchange or play with other users :

-Authentification : API 42 ou par un login
-Enregistrement de l'utilisateur si besoin avec la possibilité de choisir : authentification à double facteur (2FA), avatar, nom
-page Home qui permet d'accéder aux pages :
  - Profil :
    - choisir un avatar
    - changer son nom
    - ajouter des amis
    - voir ses achievements de jeu
    - voir ses scores de jeu
    - activer / désactiver le 2FA
    - aller sur le profil d'un autre utilisateur
 - Chat :
    - créer un channel (privé, public ou protégé) 
            - rejoindre un channel (si privé avec une invitation d'un autre utilisateur, si protégé avec un mot de passe)
            - écrire en message privé
            - option propriétaire pour les channels : modifier/ajouter un mot de passe, ajouter/supprimer des administrateurs, kick/ban/mute avec un temps limité les autres utilisateurs et administreurs
            - option administreurs pour les channels : kick/ban/mute avec un temps limité les autres utilisateurs excepté les propriétaires
            - bloqué les messages d'un autre utilisateurs jusqu'à le débloqué
            - inviter à jouer
            - accéder au profil
      - Jeu de Pong :
            - interface original Pong de 1972 et une interface custom
            - matchmaking
            - responsive

----------------
launch : 
  -  make
  -  localhost:3000

------------------
Typescript, Docker, NestJS (back), React (front), postgresql



