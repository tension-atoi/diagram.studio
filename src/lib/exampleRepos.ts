/**
 * Repositories offered as examples in the UI. Local to this module: the only
 * consumer is `isExampleRepo` below, which needs the set, not the labels.
 */
const exampleRepos = {
  FastAPI: "/fastapi/fastapi",
  Flask: "/pallets/flask",
  Monkeytype: "/monkeytypegame/monkeytype",
};

function normalizePathSegment(value: string) {
  try {
    return decodeURIComponent(value).toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

const exampleRepoPaths = new Set(
  Object.values(exampleRepos).map(normalizePathSegment),
);

export function isExampleRepo(username: string, repo: string) {
  const currentPath = `/${normalizePathSegment(username)}/${normalizePathSegment(repo)}`;
  return exampleRepoPaths.has(currentPath);
}
