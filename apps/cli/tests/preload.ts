import { mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.FVX_HOME = realpathSync(mkdtempSync(join(tmpdir(), "fvx-test-")));
delete process.env.FLUTTER_SDK_HOME;
delete process.env.FVX_VERSION;
