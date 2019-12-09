import { default as axios } from "axios";

export async function getReleases(
  repo: string,
  oldestRelease: string
): Promise<string[]> {
  // get raw data from github releases api
  try {
    const request = await axios.get(
      `https://api.github.com/repos/${repo}/releases`,
      {
        headers: {
          "User-Agent": "stresschain",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
            : {})
        }
      }
    );

    // filter out beta versions
    const allReleases = request.data.filter(
      (release: { draft: boolean; prerelease: boolean; name: string }) =>
        !release.draft && !release.prerelease && !release.name.includes("beta")
    );

    // find index of oldest release
    const oldestIndex = allReleases.findIndex(
      (release: { tag_name: string }) => release.tag_name == oldestRelease
    );

    // slice the list and return only the version numbers we want
    return allReleases
      .slice(0, oldestIndex + 1)
      .map((release: { tag_name: string }) => release.tag_name);
  } catch (err) {
    throw new Error(err);
  }
}
