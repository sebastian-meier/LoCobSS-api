# LoCobSS-api

```
firebase deploy
```

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