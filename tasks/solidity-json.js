const fs = require('fs');
const path = require('path');

async function makeDirIfNotExists(directory) {
  await new Promise((resolve) => {
    fs.access(directory, function(err) {
      if (err && err.code === 'ENOENT') {
        fs.mkdirSync(directory, {recursive: true});
      }
      resolve();
    });
  })
}

// noinspection JSUnusedGlobalSymbols
task('solidity-json', 'Extract Standard Solidity Input JSON').setAction(async (taskArgs, hre) => {
  const names = await hre.artifacts.getAllFullyQualifiedNames();
  console.log(names);
  const baseDir = './artifacts/solidity-json';

  const handled = [];

  for (const name of names) {

    let [fileName] = name.split(':');

    // skip, if non-local file
    if (!fs.existsSync(path.join('./', fileName))) {
      fileName = `node_modules/${fileName}`;
      if (!fs.existsSync(path.join('./', fileName))) {
        console.log(fileName, 'dont exists');
        continue;
      }
    }

    // only one output per file
    if (handled.find(x => x === fileName)) {
      console.log(fileName, 'double');
      continue;
    }
    handled.push(fileName);

    const buildInfo = await hre.artifacts.getBuildInfo(name);
    const artifactStdJson = JSON.stringify(buildInfo.input,null, 4);

    const fullFileName = path.join(baseDir, fileName + '.json');
    const directoryName = path.dirname(fullFileName);

    console.log('> Extracting standard Solidity Input JSON for', fileName);

    await makeDirIfNotExists(directoryName);
    fs.writeFileSync(fullFileName, artifactStdJson);
  }
});
