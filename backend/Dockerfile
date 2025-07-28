# Use official Node.js LTS image
FROM node:20

# Set working directory
WORKDIR /app



# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the backend code (including prisma/)
COPY . .

# Generate Prisma client (after code is present)
RUN npx prisma generate

# Expose the port your app runs on
EXPOSE 4000

# Start the app
CMD ["node", "app.js"]
