import { getEnv } from '@/src/modules/users/utils.js';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgunInstance = new Mailgun(formData);

const mailgunClient = mailgunInstance.client({
  username: 'api',
  key: getEnv('MAILGUN_API_KEY'),
  url: getEnv('MAILGUN_SERVER_URL'),
});

export const mailer = {
  send: async ({
    subject,
    text,
    to,
  }: Required<Pick<Parameters<typeof mailgunClient.messages.create>[1], 'text' | 'subject' | 'to'>>) => {
    return mailgunClient.messages.create(getEnv('MAILGUN_DOMAIN'), {
      to,
      from: getEnv('MAILGUN_SENDER'),
      text,
      subject,
    });
  },
};
