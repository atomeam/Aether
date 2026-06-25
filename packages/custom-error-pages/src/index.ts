/**
 * @aetheus/custom-error-pages - Custom Error Pages
 * 
 * Provides custom error page rendering.
 */

export function customErrorPages() {
  return (err: any, req: any, res: any, next: any) => {
    const status = err.status || 500;
    res.status(status).send(`Error ${status}: ${err.message}`);
  };
}