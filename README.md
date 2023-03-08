# db-website

## About this project

**Check out the website here: https://bhht.abudhabi.nyu.edu/**

## Project structure

- `db-site` - The front-end, an Angular single-page application.
- `db-api` - The back-end, a Spring Boot RESTful API and PostgreSQL database.

## Setup

### Cloning the project 

First, you need to get the project onto your computer. Here are a few ways to do that:
- If you have [Git](https://git-scm.com/) installed: open a terminal, navigate to some folder where you have decided your project will stay, and do the command `git clone https://github.com/vsharkovski/db-website.git`
- Otherwise, on the top right of this page, click the green **Code** button, click **Download ZIP**, and then extract the folder somewhere on your computer.

Either way, you should now have a **db-website** folder somewhere on your computer. Open a terminal and navigate to that folder. Afterwards, to confirm you are in the right place, do the `ls` command. You should see a list of files and folders such as **db-api, db-site, .gitignore, README.md, .idea**.

### Front-end setup

You need to have [Node.js](https://nodejs.org/en/download/) and [Angular](https://angular.io/guide/setup-local) installed. Click on the respective links for guides on how to install them.

Then, navigate into the **db-site** folder, which is inside the **db-website** folder you obtained in the *Cloning the project* section. Then, to install the project, do `npm install`.

Afterwards, to start the live server, do `ng serve`. Now go to [http://localhost:4200/](http://localhost:4200/) on your browser, and you should see the website. Any changes you make to the files will be reflected in your browser.

### Back-end setup

Todo.

## Front-end

The front-end is a single-page application developed in Angular.

## Back-end

The back-end is a RESTful API developed in Spring Boot, using PostgreSQL as a database.
