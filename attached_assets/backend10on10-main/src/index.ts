import { adapter } from '@/src/axolotl.js';
import { getUser } from '@/src/modules/users/utils.js';
import resolvers from '@/src/resolvers.js';

// This is yoga specific

adapter(
  { resolvers },
  {
    yoga: {
      maskedErrors: false,
      context: async ({ request }) => {
        const userHeader = request.headers.get('Authorization') as string | undefined;
        if (!userHeader) return {};
        const user = await getUser(userHeader);
        return {
          user,
        };
      },
    },
  },
).server.listen(4002, () => {
  console.log('LISTENING to ' + 4002);
});
