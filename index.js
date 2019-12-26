const fs = require("fs");
const path = require("path");
const concat = require("concat-stream");
const through = require("through2");
const template = require("lodash.template");
const camelCase = require("lodash.camelcase");

const commaPrefix = items => items.map(value => `, ${value}`).join("");

const capitalize = file => {
  const name = camelCase(path.basename(file.path, path.extname(file.path)));
  return name.charAt(0).toUpperCase() + name.substring(1);
};

const defaultOptions = {
  dependencies: () => [],
  exports: capitalize,
  namespace: capitalize,
  template: (/*file*/) => path.join(__dirname, "templates", "returnExports.js")
};

const buildTemplate = (file, contents, options) => {
  const amd = [];
  const cjs = [];
  const global = [];
  const param = [];
  const requires = [];
  const dependencies = options.dependencies(file);
  const match = contents.match(/\/\*\s?global ([.\s\S]*?)\*\//m);
  const deps = match && match[1].split(",").map(p => p.trim());

  if (deps) dependencies.push(...deps);

  dependencies.forEach(dep => {
    if (typeof dep === "string") {
      dep = { amd: dep, cjs: dep, global: dep, param: dep };
    }

    amd.push(`'${dep.amd || dep.name}'`);
    cjs.push(`require('${dep.cjs || dep.name}')`);
    global.push(`root.${dep.global || dep.name}`);
    param.push(dep.param || dep.name);
    requires.push(`${dep.param || dep.name}=require('${dep.cjs || dep.name}')`);
  });

  return options.compiled({
    file,
    contents,
    dependencies,
    exports: options.exports(file),
    namespace: options.namespace(file),
    amd: `[${amd.join(", ")}]`,
    cjs: cjs.join(", "),
    global: global.join(", "),
    param: param.join(", "),
    commaCjs: commaPrefix(cjs),
    commaGlobal: commaPrefix(global),
    commaParam: commaPrefix(param)
  });
};

const wrap = (file, options) => {
  if (file.isStream()) {
    const data = through();

    file.contents.pipe(
      concat({ encoding: "utf-8" }, stream => {
        data.push(...[buildTemplate(file, stream, options), null]);
      })
    );

    file.contents = data;
  } else if (file.isBuffer()) {
    const contents = file.contents.toString();
    file.contents = Buffer.from(buildTemplate(file, contents, options));
  }
};

module.exports = opts => {
  const options = { ...defaultOptions, ...opts };

  return through.obj((file, _enc, next) => {
    let err;
    let text;

    if (options.templateName) {
      text = options.templateName(file);
      text === "amdNodeWeb" && (text = "returnExports");
      text = path.join(__dirname, "templates", `${text}.js`);
      text = fs.readFileSync(text, "utf8");
    } else if (options.templateSource) {
      text = options.templateSource(file);
    } else {
      text = fs.readFileSync(options.template(file), "utf8");
    }

    try {
      wrap(file, { ...options, compiled: template(text) });
    } catch (e) {
      err = e;
    }

    next(err, file);
  });
};

module.exports.capitalize = capitalize;
