import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivityLogsService } from './activity-logs.service';

@Injectable()
export class ActivityLogsInterceptor implements NestInterceptor {
  constructor(
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const method = request.method?.toUpperCase();

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const endpoint = request.originalUrl || request.url || '';

    const excludedRoutes = [
      '/auth/login',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];

    if (excludedRoutes.some((route) => endpoint.includes(route))) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const user = request.user || {};

        const actorId =
          user.sub || user.userId || user.id || user._id || null;
const routeParts: string[] = endpoint
  .split('?')[0]
  .split('/')
  .filter(Boolean);

const apiIndex = routeParts.indexOf('api');
const routePartsWithoutApi =
  apiIndex >= 0 ? routeParts.slice(apiIndex + 1) : routeParts;

const resource =
  routePartsWithoutApi[0] === 'admin'
    ? routePartsWithoutApi[1] || 'system'
    : routePartsWithoutApi[0] || 'system';

        const actionMap: Record<string, string> = {
          POST: 'CREATE',
          PUT: 'UPDATE',
          PATCH: 'UPDATE',
          DELETE: 'DELETE',
        };

        const log = {
          actorId,
          actorRole: user.role || 'Unknown',
          action: actionMap[method],
          resource,
          description: `${method} ${endpoint}`,
          method,
          endpoint,
          ipAddress: request.ip,
          userAgent: request.headers?.['user-agent'],
        };

        if (response.statusCode < 400) {
          void this.activityLogsService.create(log).catch(() => undefined);
        }
      }),
    );
  }
}