import {Cradle, diContainer, fastifyAwilixPlugin} from '@fastify/awilix';
import cors from '@fastify/cors';
import fastifyJWT from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import {
  asClass,
  asValue,
  AwilixContainer,
  Lifetime,
  NameAndRegistrationPair,
} from 'awilix';
import fastify, {FastifyInstance} from 'fastify';
import fastifyRawBody from 'fastify-raw-body';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import * as schedule from 'node-schedule';
import {
  RecurrenceRule,
  RecurrenceSpecDateRange,
  RecurrenceSpecObjLit,
} from 'node-schedule';
import {env} from '../env';
import {API_INFO, LOGGER} from './constant';
import {health} from './controller/actions/health';
import {buildRoutes} from './controller/route';
import {DbService, PgOptions} from './services/dbService';
import {Controller, JobHandler, JwtFilterRule} from './type';
import {fastifyRequestContext} from "@fastify/request-context";
import {ZodError} from "zod";

const predefinedCtls: Controller[] = [
  {
    prefix: '/health',
    actions: [{path: '/', method: 'get', handler: health}],
  },
];

declare module '@fastify/request-context' {
	interface RequestContextData {
		ethAddress?: string,
	}
}

export class Application {
  private server?: FastifyInstance;
  private diContainer: AwilixContainer<Cradle>;

  private ctls: Controller[] = [];
  private jwtRules: JwtFilterRule[] = [];

  constructor() {
    this.diContainer = diContainer;
  }

  controllers(value: Controller[]) {
    this.ctls = value;
    return this;
  }

  securityRules(value: JwtFilterRule[]) {
    this.jwtRules = value;
    return this;
  }

  pgOpts(value: PgOptions) {
    this.diContainer.register({
      pgOpts: asValue(value),
      dbService: asClass(DbService, {
        lifetime: Lifetime.SINGLETON,
        dispose: module => module.dispose(),
      }),
    });
    return this;
  }

  resolve<T>(name: string) {
    return this.diContainer.resolve<T>(name);
  }

  register(nameAndRegistrationPair: NameAndRegistrationPair<Cradle>) {
    this.diContainer.register(nameAndRegistrationPair);
    return this;
  }

  registrations() {
    return this.diContainer.registrations;
  }

  build() {
    this.server = fastify({
      logger: LOGGER,
      trustProxy: true,
      bodyLimit: 10485760, // 10 MiB
    });

    this.server.setValidatorCompiler(validatorCompiler);
    this.server.setSerializerCompiler(serializerCompiler);

    this.server.setErrorHandler((error, request, reply) => {
	  if (error instanceof ZodError) {
		  try {
			  reply.status(400).send({
				  ...error,
				  message: "Validation errors: " + error.issues.map((error) => error.message).join(". "),
			  });
              return;
		  } catch (e) {

		  }
	  }
      reply.status(500).send(error);
    });

    this.server
      .withTypeProvider<ZodTypeProvider>()
      .register(fastifySwagger, {
        openapi: {
          info: API_INFO,
          servers: [],
          components: {
            securitySchemes: {
              jwt: {
                type: 'http',
                scheme: 'bearer',
              },
            },
          },
        },
        transform: jsonSchemaTransform,
      })
      .register(cors, {
		  origin: "*"
	  })
      //.register(fastifyJWT, {secret: env.JWT_SECRET})
      .register(fastifyRawBody, {
        global: false,
        runFirst: true,
      })
      .register(fastifyAwilixPlugin, {
        disposeOnClose: true,
        disposeOnResponse: false,
      })
      .register(fastifySwaggerUI, {
        routePrefix: '/documentation',
        uiConfig: {
          persistAuthorization: true
        },
      })
	  .register(fastifyRequestContext)
      .register(buildRoutes([...this.ctls, ...predefinedCtls], this.jwtRules))
      .after(err => {
        if (err) {
          console.log(`register plugins failed: ${err.message}`);
          throw err;
        }
      })
      .ready()
      .then(
        () => {
          LOGGER.info('Server successfully booted!');
        },
        err => {
          LOGGER.trace('Server start error', err);
        }
      );
    return this.server;
  }

  async start(port = 3006, host = '127.0.0.1') {
    if (!this.server) {
      this.server = this.build();
    }

    await this.server.listen({port, host});

    this.server.log.info(`🚀 Server running on port ${port}`);
    this.server.log.info(
      `🚀 Api document on http://${host}:${port}/documentation`
    );
  }

  scheduleJob(
    rule:
      | RecurrenceRule
      | RecurrenceSpecDateRange
      | RecurrenceSpecObjLit
      | Date
      | string
      | number,
    handler: JobHandler
  ) {
    schedule.scheduleJob(rule, fireDate => {
      handler(this.diContainer, fireDate);
    });
    return this;
  }
}
