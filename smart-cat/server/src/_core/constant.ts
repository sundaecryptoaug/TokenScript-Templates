import pino from 'pino';
import {env} from '../env';

export const LOGGER = pino({level: env.LOG_LEVEL});

export const API_INFO = {
  title: 'TokenScript Chat API',
  description: 'The API for providing chat & messaging services for TokenScript applications',
  version: '0.1.0',
};
