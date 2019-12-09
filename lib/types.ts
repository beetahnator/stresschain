import { types } from "@pulumi/kubernetes"

export interface clientArgs {
  name: string;
  githubRepo: string;
  oldestRelease: string;
  container: {
    dockerRepo: string;
    imageSuffix?: string;
    stripChars?: string[];
    dataDirSize: string;
    command?: string[];
    args?: string[];
    env?: types.input.core.v1.EnvVar[]
  };
};