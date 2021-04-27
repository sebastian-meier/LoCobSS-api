const fs = require('fs');

(async () =>  {

  const swaggerJsdoc = await import('swagger-jsdoc');

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'LoCobSS API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      }
    },
    apis: [
      './src/questions/routes-config.ts'
    ],
  };
  
  const openapiSpecification = await swaggerJsdoc.default(options);
  
  fs.writeFileSync('swagger.json', JSON.stringify(openapiSpecification), 'utf8');

})();