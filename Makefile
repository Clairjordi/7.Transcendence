all: build

build:
	docker-compose up --build -d

ps:
	docker-compose ps

stop:
	docker-compose stop 

down:
	docker-compose down

ds:
	docker-compose stop 

fclean: 
	docker-compose down --rmi all
	docker system prune --volumes --force --all

re: fclean all

.PHONY: all re fclean build down ps stop
