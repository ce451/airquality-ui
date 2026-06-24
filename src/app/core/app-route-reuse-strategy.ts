import {ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy} from '@angular/router';

// Keeps the live view of routes flagged with `data: { reuse: true }` (the
// dashboard) in memory when navigating away, and re-attaches it on return.
//
// Why: the dashboard loads its station list (and each card its measurements)
// asynchronously. Without reuse, navigating back recreates the component, so at
// the moment Angular restores the scroll position the grid is still empty and
// there is nothing to scroll to — the page jumps to the top. Re-attaching the
// already-rendered view means the full-height grid is present immediately, so
// `scrollPositionRestoration: 'enabled'` lands on the exact previous position.
// As a bonus, going back is instant (no spinner flash, no refetch).
export class AppRouteReuseStrategy implements RouteReuseStrategy {
  private handlers = new Map<string, DetachedRouteHandle>();

  // Detach (and keep) only routes that opted in via route data.
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.routeConfig?.data?.['reuse'] === true;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const key = this.getKey(route);
    if (!key) {
      return;
    }
    if (handle) {
      this.handlers.set(key, handle);
    } else {
      this.handlers.delete(key);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.handlers.has(this.getKey(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.handlers.get(this.getKey(route)) ?? null;
  }

  // Default Angular behaviour: reuse the component when the route config is the
  // same (e.g. station/5 -> station/7 just re-fires params, as before).
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  private getKey(route: ActivatedRouteSnapshot): string {
    return route.routeConfig?.path ?? '';
  }
}
