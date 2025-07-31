FROM node:14.17.3 as build

# Create html and workdir
RUN mkdir -p /var/www/html/
RUN mkdir -p /home/myFrontend

WORKDIR /home/myFrontend

# install package.json
COPY package.json /home/myFrontend/package.json
COPY . /home/myFrontend

#Install npm
RUN npm install -g @angular/cli
RUN npm install

# Build
RUN npm run build

# Copy files to html dir
FROM node:14.17.3
COPY --from=build /home/myFrontend/dist/myProject/ /var/www/html/
