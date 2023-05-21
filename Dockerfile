# Use the official Node.js 18 image as the base image
FROM node:18

# Set the working directory in the container to /app
WORKDIR /app

# Copy the package.json and package-lock.json files into the container
COPY package*.json ./

# Install the dependencies specified in the package.json file
RUN npm install

# Update the package index and install SQLite using apt-get
RUN apt-get update && apt-get install -y sqlite3

# Copy the rest of the application files into the container
COPY . .

# Create a volume for the SQLite database file
VOLUME /app/data

# Set the default command to run when the container starts
CMD ["npm", "start"]
