import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  // Inject JWT authorization header for all requests going to our backend API config URL
  if (token && (req.url.includes('/api/') || req.url.includes('lowca-backend.onrender.com'))) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }
  return next(req);
};
