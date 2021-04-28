This repo is part of the LoCobSS research project. More details about the project and dependencies to other repos can be found [here](https://github.com/sebastian-meier/LoCobSS-documentation).

# LoCobSS-api

This is the main api for [locobss-plattform](https://www.github.com/sebastian-meier/LoCobSS-platform). For more details see the:

- [API-Documentation](https://sebastian-meier.github.io/LoCobSS-api/apidocs)
- [Code Documentation](https://sebastian-meier.github.io/LoCobSS-api/code)

## Deploy
```
firebase deploy
```

## Local testing
```bash
cd functions
npm install
npm run serve
```
For local testing a .env file is also requried. See .env-sample for more info.

## API Docs
Generate swagger.json by running
```bash
cd functions
node .swagger-gen.js
```
To transform swagger.json into a ui documentation, there are various tools. We used swagger-codegen-cli:
```bash
java -jar '/PATH_TO_SWAGGER_CODEGEN/swagger-codegen-cli-3.0.25.jar' generate -i swagger.json -o ../apidocs -l html2
```
