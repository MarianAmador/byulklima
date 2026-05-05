import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const start = Date.now();
  console.log('[Byulklima] Request:', req.method, req.url);
  return next(req).pipe(
    tap({
      next: () => console.log('[Byulklima] Response OK -', Date.now() - start + 'ms'),
      error: (err) => console.error('[Byulklima] Error:', err.status, err.message)
    })
  );
};
