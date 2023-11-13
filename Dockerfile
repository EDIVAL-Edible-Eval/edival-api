# from base image node
FROM node:16

# sets the working directory
WORKDIR /app

# copying all the files from your file system to container file system
COPY package*.json ./

# install all dependencies
RUN npm install

# copy oter files as well
COPY . .

# set env variables
ENV MY_ENV=development
ENV NAME="EDIVAL (Edible Eval)"
ENV PORT=3000
ENV API_KEY=AIzaSyChk3kTGoQzR4pRY-iFmaKlIQCYeYksWVc
ENV AUTH_DOMAIN=edival-402305.firebaseapp.com
ENV PROJECT_ID=edival-402305
ENV STORAGE_BUCKET=edival-402305.appspot.com
ENV MESSAGING_SENDER_ID=932830200046
ENV APP_ID=1:932830200046:web:90bbd84c51017961de73ff

#expose the port
EXPOSE 3000

# command to run when intantiate an image
CMD ["npm","start"]