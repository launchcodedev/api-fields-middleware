import { Middleware } from 'koa';
import { Class } from '@lcdev/ts';
import { extract, Extraction } from '@lcdev/mapper';
import { getApiFields } from '@lcdev/api-fields';

export function extractApiFieldsMiddleware(
  klass: Class<any> | [Class<any>] | any,
  raw: boolean = false,
): Middleware {
  let extraction: Extraction;

  if (raw) {
    extraction = klass;
  } else {
    extraction = Array.isArray(klass) ? [getApiFields(klass[0])] : getApiFields(klass);
  }

  return async (ctx, next) => {
    await next();

    if (ctx.status === 200) {
      if (ctx.body && typeof ctx.body === 'object') {
        ctx.body = extract(ctx.body, extraction);
      }
    }
  };
}

export default extractApiFieldsMiddleware;
