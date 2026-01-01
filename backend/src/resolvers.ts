import { mergeAxolotls } from '@aexol/axolotl-core';
import todosResolvers from '@/src/main/resolvers.js';
import usersResolvers from '@/src/modules/users/resolvers.js';
import { mailer } from './mailgunClient.js';

export default mergeAxolotls(
  todosResolvers,
  usersResolvers({
    sendMailForgotPassword: async (args) => {
      await mailer.send({
        subject: `Password reset token`,
        text: `Reset your password. Enter this token inside the app: ${args.resetPasswordToken}`,
        to: args.username,
      });
    },
    sendMailRegister: async () => {},
  }),
);
