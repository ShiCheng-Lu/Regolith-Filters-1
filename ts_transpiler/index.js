const glob = require("glob");
const fs = require("fs");
const { exec } = require("child_process");
const resolve_modules = require("./resolve_modules");

const defSettings = {
  removeTS: false,
  path: "BP/scripts",
  compilerOptions: {},
  resolve_modules: true,
  package_path: "."
};
const settings = Object.assign(
  defSettings,
  process.argv[2] ? JSON.parse(process.argv[2]) : {}
);
const typeMap = {
  removeTS: "boolean",
  path: "string",
  compilerOptions: "object",
  resolve_modules: "boolean",
  package_path: "string",
};
const throwTypeError = (k) => {
  throw new TypeError(
    `${k}: ${JSON.stringify(settings[k])} is not an ${typeMap[k]}`
  );
};
for (let k in typeMap) {
  if (typeMap[k] === "array") {
    if (!Array.isArray(settings[k])) throwTypeError(k);
  } else if (typeMap[k] === "object") {
    if (Array.isArray(settings[k])) throwTypeError(k);
  } else if (typeof settings[k] !== typeMap[k]) throwTypeError(k);
}
// resolve ts modules
if (resolve_modules) resolve_modules("ts", settings);
// compile
fs.writeFileSync(
  "tsconfig.json",
  JSON.stringify({
    compilerOptions: settings.compilerOptions,
    include: [`${settings.path}/*`],
  })
);
exec(`npx tsc -p "tsconfig.json"`, (err, stdout, stderr) => {
  if (stdout) console.error(stdout);
  if (stderr) console.error(stderr);
  if (err && !stderr && !stderr) console.error(err);

  if (settings.removeTS) {
    glob(`${settings.path}/**/*.ts`, null, (err, files) => {
      files.forEach((filePath) => {
        fs.unlinkSync(filePath);
      });
    });
    fs.unlinkSync("tsconfig.json");
  }
});
// resolve js modules, js needs to be resolved after compile as there may be type errs
if (resolve_modules) resolve_modules("js", settings);
