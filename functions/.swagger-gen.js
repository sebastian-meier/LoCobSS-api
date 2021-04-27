const fs = require('fs');

(async () =>  {

  const swaggerJsdoc = await import('swagger-jsdoc');

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'LoCobSS API',
        version: '3.0.0',
        description: 'Hello world api'
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        },
        schemas: {
          Question: {
            properties: {
              id: { type: "integer" },
              question_de: { type: "string" },
              description_de: { type: "string" },
              participantSynonym: { type: "string" },
              created: { type: "string" },
              relation: { type: "string" },
              tsne_x: { type: "number" },
              tsne_y: { type: "number" },
              liked: { type: "boolean" },
              state: { type: "string" },
              has_reply: { type: "boolean" },
              sentiment_summary: { type: "string" },
              sonar_all: { type: "string" },
              profanityfilter: { type: "number" },
              taxonomies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    name: { type: "string" }
                  }
                }
              },
              replies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    name: { type: "string" }
                  }
                }
              }
            }
          },
          Questions: {
            type: "array",
            items: {
              $ref: '#/components/schemas/Question'
            }
          },
          PublicQuestion: {
            properties: {
              id: { type: "integer" },
              question_de: { type: "string" },
              description_de: { type: "string" },
              participantSynonym: { type: "string" },
              created: { type: "string" },
              relation: { type: "string" },
              liked: { type: "boolean" },
              state: { type: "string" },
              has_reply: { type: "boolean" },
              taxonomies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    name: { type: "string" }
                  }
                }
              },
              replies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    name: { type: "string" }
                  }
                }
              }
            }
          },
          PublicQuestions: {
            type: "array",
            items: {
              $ref: '#/components/schemas/PublicQuestion'
            }
          },
          PaginatedResult: {
            type: "object",
            properties: {
              maxPage: { type: "integer" },
              count: { type: "integer" },
              dateRange: {
                type: "array",
                description: "min and max date",
                items: { type: "string", description: "date string" }
              },
              page: { type: "integer" },
              hasSearch: { type: "boolean" },
              hasTaxonomy: { type: "boolean" },
              hasDate: { type: "boolean" },
              hasAnswer: { type: "boolean" },
              results: {
                type: "array",
                items: {
                  $ref: '#/components/schemas/PublicQuestions'
                }
              }
            }
          },
          SimpleResult: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  $ref: '#/components/schemas/PublicQuestions'
                }
              }
            }
          },
          ErrorMessage: {
            type: "object",
            properties: {
              message: { type: "string" },
              errorCode: { type: "integer" }
            }
          },
          Reply: {
            type: "object",
            properties: {
              id: { type: "integer" },
              body: { type: "string" },
              name: { type: "string" },
              url: { type: "string" }
            }
          },
          Replies: {
            type: "array",
            items: {
              $ref: '#/components/schemas/Reply'
            }
          },
          Taxonomy: {
            type: "object",
            properties: {
              id: { type: "integer" },
              parent: { type: "integer" },
              name: { type: "string" }
            }
          },
          Taxonomies: {
            type: "array",
            items: {
              $ref: '#/components/schemas/Taxonomy'
            }
          },
          User: {
            type: "object",
            properties: {
              displayName: { type: "string" }
            }
          }
        }
      },
    },
    definitions: {
    },
    apis: [
      './src/questions/routes-config.ts',
      './src/replies/routes-config.ts',
      './src/taxonomies/routes-config.ts',
      './src/users/routes-config.ts'
    ],
  };
  
  const openapiSpecification = await swaggerJsdoc.default(options);
  
  fs.writeFileSync('swagger.json', JSON.stringify(openapiSpecification), 'utf8');

})();