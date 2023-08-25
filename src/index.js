/// <reference types="@fastly/js-compute" />

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger, shouldLog } from './logger.js'
import { ReplacerStream } from './ReplacerStream.js';

export const app = new Hono()

app.onError((error, c) => {
  if (shouldLog) {
    console.error('Internal App Error:', error, error.stack, error.message);
  }
	return c.text('Internal Server Error', 500)
});

app.use('*', logger());

app.use('*', async (c, next) => {
  await next()
  c.header("x-compress-hint", "on")
});

app.use('*', cors());

const replacerStream = new ReplacerStream('//a.storyblok.com/', '//restcdn.staging.dictionary.com/storyblok/');
app.get('/', async c => {
  const url = new URL(c.req.url);

  // Forward the request to a backend.
  const beresp = await fetch(`https://api.storyblok.com${url.pathname}${url.search}`, {
    headers: {
      'Host': 'api.storyblok.com'
    },
    backend: "storyblok",
  });

  if (beresp.ok) {
    const transformedStream = beresp.body
        .pipeThrough(replacerStream);
    const resp = new Response(transformedStream, {
      status: beresp.status,
      statusText: beresp.statusText,
      headers: beresp.headers
    });
    return resp;
  } else {
    return beresp;
  }
})

app.fire()