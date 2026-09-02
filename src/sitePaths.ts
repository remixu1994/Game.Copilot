const baseUrl = import.meta.env.BASE_URL;

export function sitePath(path: string) {
  if (!path || path.startsWith('#') || /^(?:[a-z]+:)?\/\//i.test(path)) {
    return path;
  }

  return `${baseUrl}${path.replace(/^\/+/, '')}`;
}

export function assetPath(path?: string | null) {
  return path ? sitePath(path) : undefined;
}

export function currentRoutePath(pathname = window.location.pathname) {
  const basePath = baseUrl.replace(/\/$/, '');

  if (basePath && pathname.startsWith(basePath)) {
    return pathname.slice(basePath.length) || '/';
  }

  return pathname || '/';
}
