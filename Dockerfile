FROM node:22-alpine

# Set working dir
WORKDIR /usr/src/app

# Copy package.json and install deps first (better caching)
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source
COPY src ./src
COPY README.md ./
COPY .env ./

EXPOSE 3000
# Expose nothing — runs background process
CMD ["npm", "run", "start"]
