# Use Node.js v as the base image
FROM node:18.12.1

# Create a new directory for your bot files
WORKDIR /app

# Copy your bot files into the container
COPY . .

# Install dependencies
RUN npm install

RUN npm install sqlite3 --save

# Run the bot
CMD ["npm", "start"]