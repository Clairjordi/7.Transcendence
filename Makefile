all: build

build:
	mkdir -p ./database ./back/src/avatars
	docker-compose up --build -d

ps:
	docker-compose ps

stop:
	docker-compose stop 

down:
	docker-compose down

ds:
	docker-compose stop 
	sudo rm -rf ./database ./back/src/avatars

fclean: 
	docker-compose down --rmi all
	docker system prune --volumes --force --all
	sudo rm -rf ./database ./back/src/avatars

re: fclean all

.PHONY: all re fclean build down ps stop
