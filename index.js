const fs = require("fs");
const path = require("path");
const concat = require("concat-stream");
const through = require("through2");
const template = require("lodash.template");

const commaPrefix = items => items.map(value => `, ${value}`).join("");

const capitalize = file => {
  const name = path.basename(file.path, path.extname(file.path));
  return name.charAt(0).toUpperCase() + name.substring(1);
};

const defaultOptions = {
  dependencies: () => [],
  exports: capitalize,
  namespace: capitalize,
  template: (/*file*/) => path.join(__dirname, "templates", "returnExports.js")
};

const buildTemplate = (file, options) => {
  const amd = [];
  const cjs = [];
  const global = [];
  const param = [];
  const requires = [];
  const dependencies = options.dependencies(file);

  dependencies.forEach(dep => {
    if (typeof dep === "string") {
      dep = { amd: dep, cjs: dep, global: dep, param: dep };
    }

    amd.push(`'${dep.amd || dep.name}'`);
    cjs.push(`require('${dep.cjs || dep.name})')`);
    global.push(`root.${dep.global || dep.name}`);
    param.push(dep.param || dep.name);
    requires.push(`${dep.param || dep.name}=require('${dep.cjs || dep.name}')`);
  });

  return {
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
  };
};

const wrap = (file, compiled, data) => {
  data.file = file;

  if (file.isStream()) {
    const contents = through();

    file.contents.pipe(
      concat({ encoding: "utf-8" }, stream => {
        data.contents = stream;
        contents.push(compiled(data));
        contents.push(null);
      })
    );

    file.contents = contents;
  } else if (file.isBuffer()) {
    data.contents = file.contents.toString();
    file.contents = Buffer.from(compiled(data));
  }
};

exports.capitalize = capitalize;

module.exports = options => {
  options = Object.assign({}, defaultOptions, options);

  return through.obj((file, _enc, next) => {
    let err;
    let text;

    if (options.templateName) {
      text = options.templateName;
      text === "amdNodeWeb" && (text = "returnExports");
      text = path.join(__dirname, "templates", `${text}.js`);
      text = fs.readFileSync(text);
    } else if (options.templateSource) {
      text = options.templateSource;
    } else {
      text = fs.readFileSync(options.template(file));
    }

    try {
      wrap(file, template(text), buildTemplate(file, options));
    } catch (e) {
      err = e;
    }

    next(err, file);
  });
};
