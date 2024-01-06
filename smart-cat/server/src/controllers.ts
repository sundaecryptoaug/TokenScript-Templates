import {Controller, JwtFilterRule} from './_core/type';
import {getChallenge, getMessageHistory, getNewMessageCount, postSendMessage} from "./handlers/api/messageActions";

export const controllers: Controller[] = [
  {
    prefix: '/api',
    actions: [getChallenge, getNewMessageCount, getMessageHistory, postSendMessage],
  },
];

export const securityRules: JwtFilterRule[] = [
  {pattern: /^\/projects/, httpMethod: ['post', 'get']},
];
