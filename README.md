## Getting Started

### Installation
    yarn install

### Run Dev mode with HMR
    yarn dev

### Run Prod mode
    - yarn build
    - copy static folder to ./next/standalone/.next
    - node ./next/standalone/server.js

### Deploy
    - yarn build
    - copy static folder to ./next/standalone/.next
    - copy public folder to ./next/standalone
    - copy all files from ./next/standalone to server
    - run command "node server"

### Linting and Formating
    yarn prebuild