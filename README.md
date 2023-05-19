# db-website

## About this project

**Check out the website here: https://bhht.abudhabi.nyu.edu/**

## Project structure

- `db-site` - The front-end, an Angular single-page application (SPA).
- `db-api` - The back-end, a Spring Boot RESTful API and PostgreSQL database.

## Setup

### Cloning the project 

First, you need to get the project onto your computer. Here are a few ways to do that:
- If you have [Git](https://git-scm.com/) installed: open a terminal, navigate to some folder where you have decided your project will stay, and do the command `git clone https://github.com/vsharkovski/db-website.git`
- Otherwise, on the top right of this page, click the green `Code` button, click `Download ZIP`, and then extract the folder somewhere on your computer.

Either way, you should now have a `db-website` folder somewhere on your computer. Open a terminal and navigate to that folder. Afterwards, to confirm you are in the right place, do the `ls` command. You should see a list of files and folders such as `db-api, db-site, .gitignore, README.md, .idea`.

### Front-end setup

You need to have [Node.js](https://nodejs.org/en/download/) and [Angular](https://angular.io/guide/setup-local) installed. Click on the respective links for guides on how to install them.

Then, navigate into the `db-site` folder, which is inside the `db-website` folder you obtained in the *Cloning the project* section. Then, to install the project, do `npm install`.

Afterwards, to start the live server, do `ng serve`. Now go to [http://localhost:4200/](http://localhost:4200/) on your browser, and you should see the website. Any changes you make to the files will be reflected in your browser.

### Back-end setup

You need a SQL server installed, such as PostgreSQL.

Afterwards you can open the project at the level of the root folder (`db-website`) using an IDE such as IntelliJ IDEA.

You can configure the database connection in files in the `db-api/src/main/resources` folder, such as `application-dev.yml`. Note: you must use the `dev` profile when running Spring in order for this configuration to be applied.

## Front-end (db-site)

The front-end is an Angular SPA. It send and receives HTTP requests to the back-end. You may want to configure how requests are proxied in the file `proxy.conf.json`.

## Back-end (db-api)

The back-end is a RESTful API developed in Spring Boot, using an SQL database such as PostgreSQL. All the configuration is located in `application.yml` and its derivatives. To apply a certain configuration besides `application.yml`, such as `application-dev.yml`, you must use the `dev` profile when running the Spring project.

It is also recommended to create an `application-local.yml` 

#### Importing a dataset
