# # Use an official Node.js image
# FROM node:18

# # Set working directory
# WORKDIR /app

# # Copy package.json and install dependencies
# COPY package.json package-lock.json ./
# RUN npm install

# # Copy all frontend files to the container
# COPY . .

# # Build the React app
# RUN npm run build

# # Use Nginx to serve the built frontend
# FROM nginx:alpine
# COPY --from=0 /app/dist /usr/share/nginx/html

# # Expose port 80 for web traffic
# EXPOSE 80

# # Start Nginx
# CMD ["nginx", "-g", "daemon off;"]

# NOTHING YET
