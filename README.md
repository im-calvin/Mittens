# Mittens
[![fork with dotenv-vault](https://badge.dotenv.org/fork.svg?r=1)](https://vault.dotenv.org/project/vlt_a88b4b86e3be377976336d5bc2d9f508d0792bbfd9cce02ce5af9879e452e3ca/example)

## Building Instructions

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