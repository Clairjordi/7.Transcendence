# TRANSCENDENCE

School Project 42: (in a group - final project)

## Creation of a full stack website in SPA whose aim is to be able to exchange or play with other users :

- Authentication: API 42 or if you do not have an identifier 42 -> by a login
- REGISTRATION : choose your Nickname, your Avatar, be unique 
- HOME:
  - Profil :
      personalize your profile, add friends, activate/deactivate 2FA or even view your game scores and achievements
  - Chat :
    - créer un channel (privé, public ou protégé)
    - rejoindre un channel (si privé avec une invitation d'un autre utilisateur, si protégé avec un mot de passe)
    - écrire en message privé
    - option propriétaire pour les channels : modifier/ajouter un mot de passe, ajouter/supprimer des administrateurs, kick/ban/mute avec un temps limité les autres utilisateurs et administreurs
    - option administreurs pour les channels : kick/ban/mute avec un temps limité les autres utilisateurs excepté les propriétaires
    - bloqué les messages d'un autre utilisateurs jusqu'à le débloqué
    - inviter à jouer
    - accéder au profil
  - PONG GAME :
    - interface original Pong de 1972 et une interface custom
    - matchmaking
    - responsive

----------------
## For launch : 
  -  Run `make`
  -  Got to `https://localhost:3000/`

------------------
## Buid with:
  +Typescript
  +NestJS, 
  +React, 
  +Postgresql
  +Docker



