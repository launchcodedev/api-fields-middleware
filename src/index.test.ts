import * as Koa from 'koa';
import { createServer } from 'http';
import { agent, SuperTest, Test } from 'supertest';
import { getApiFields, ApiField } from '@lcdev/api-fields';
import { extractApiFieldsMiddleware } from './index';

type Callback = (test: SuperTest<Test>) => Promise<void>;

export async function routerTest(setup: (koa: Koa) => Koa, callback: Callback) {
  await callback(agent(createServer(setup(new Koa()).callback())));
}

class SampleEntityA {
  @ApiField()
  publicFieldA = 1;
  privateFieldA = 1;
  @ApiField()
  publicFieldB = 1;
  privateFieldB = 1;
}

describe('extractApiFieldsMiddleware', () => {
  test('empty response', () =>
    routerTest(
      app =>
        app.use(extractApiFieldsMiddleware(SampleEntityA)).use((ctx, next) => {
          if (ctx.path === '/foo') {
            ctx.status = 200;
          }

          return next();
        }),
      async test => {
        await test.get('/bar').expect(404);
        await test.get('/foo').expect(200);
      },
    ));

  test('normal extraction', () =>
    routerTest(
      app =>
        app.use(extractApiFieldsMiddleware(SampleEntityA)).use((ctx, next) => {
          if (ctx.path === '/foo') {
            ctx.body = new SampleEntityA();
            ctx.status = 200;
          }

          return next();
        }),
      async test => {
        await test.get('/bar').expect(404);
        await test
          .get('/foo')
          .expect(200)
          .expect({ publicFieldA: 1, publicFieldB: 1 });
      },
    ));

  test('array extraction', () =>
    routerTest(
      app =>
        app.use(extractApiFieldsMiddleware([SampleEntityA])).use((ctx, next) => {
          if (ctx.path === '/foo') {
            ctx.body = [new SampleEntityA(), new SampleEntityA()];
            ctx.status = 200;
          }

          return next();
        }),
      async test => {
        await test.get('/bar').expect(404);
        await test
          .get('/foo')
          .expect(200)
          .expect([
            { publicFieldA: 1, publicFieldB: 1 },
            { publicFieldA: 1, publicFieldB: 1 },
          ]);
      },
    ));

  test('raw extraction', () =>
    routerTest(
      app =>
        app
          .use(
            extractApiFieldsMiddleware(getApiFields(SampleEntityA, { privateFieldA: true }), true),
          )
          .use((ctx, next) => {
            if (ctx.path === '/foo') {
              ctx.body = new SampleEntityA();
              ctx.status = 200;
            }

            return next();
          }),
      async test => {
        await test.get('/bar').expect(404);
        await test
          .get('/foo')
          .expect(200)
          .expect({ publicFieldA: 1, publicFieldB: 1, privateFieldA: 1 });
      },
    ));
});
