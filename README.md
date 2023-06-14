# Mittens
[![fork with dotenv-vault](https://badge.dotenv.org/fork.svg?r=1)](https://vault.dotenv.org/project/vlt_a88b4b86e3be377976336d5bc2d9f508d0792bbfd9cce02ce5af9879e452e3ca/example)

## Building & Running

You can either build it locally or use the Docker Hub Image 

### Locally

1. Install required packages with `npm i`

2. Install `SQLite3` following [this documentation](https://www.sqlite.org/download.html)

3. Get a `.env` file by forking the repository and filling it out.

4. Run `npm start`

### Pull and Run with Docker

1. Pull: `docker pull imcalvin/mittens:latest`

2. Fill out the `.env` file on dotenv-vault and acquire a `DOTENV_KEY` for the next step

3. Run: `docker run -d -e DOTENV_KEY=<YOUR_DOTENV_KEY> imcalvin/mittens:latest`

### Building for Docker
First login: `docker login`

Build: `docker build -t mittens .`

Tag: `docker tag mittens imcalvin/mittens:VER_NUM`

Push: `docker push imcalvin/mittens:VER_NUM`

## Database 

The database uses SQLite with TypeORM. Notes on the tables:
- The `languages` table refers to the organization (ex: Hololive) as well as the language (ex: English). 
- The `groups` table is more specific and refers to a specific generation (ex: Hololive English Council)


![Database Diagram](/static/dbdiagram.png)

## CI/CD

![CI/CD Pipeline](/static/CI_CD.jpg)
