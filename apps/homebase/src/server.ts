import { createApp } from './app.js';
import { getEnv } from './lib/env.js';

const env = getEnv();
const app = createApp({ env });

app.listen(env.PORT, () => {
  console.log(`homebase listening on http://localhost:${env.PORT}`);
});
