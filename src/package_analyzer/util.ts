import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import * as rm from "rimraf";

function createTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "temp-"));
}

/**
 * Create and enter a temporary workspace. On promise resolve, we are back to the original CWD (with temp directory optionally removed.)
 * @param cb async callback to run when inside this directory
 * @param cleanup whether we should auto remove this temp directory when leaving.
 */
export async function enterTempDir<T>(cb: (tempDir: string) => Promise<T>, cleanup = false): Promise<T> {
  const tempDir = await createTempDir();
  const origDir = process.cwd();
  process.chdir(tempDir);
  let output: T;
  let maybeError = null;
  try {
    output = await cb(tempDir);
  } catch (e) {
    maybeError = e;
  }
  process.chdir(origDir);
  if (cleanup) {
    rm.sync(tempDir); // BE CAREFUL!
  }
  if (maybeError) {
    throw maybeError;
  }
  return output!;
}
