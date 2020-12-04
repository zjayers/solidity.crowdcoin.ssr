const path = require("path");
const fs = require("fs-extra");
const solc = require("solc");

const CAMPAIGN_FILE_NAME = "Campaign.sol";

// Read in source code from campaign file and compile the contracts
const campaignFolderPath = path.resolve(
  __dirname,
  "contracts",
  CAMPAIGN_FILE_NAME
);
const sourceCode = fs.readFileSync(campaignFolderPath, "utf8");
const output = solc.compile(sourceCode, 1).contracts;

// Delete build folder if it exists
const buildFolderPath = path.resolve(__dirname, "build");
fs.removeSync(buildFolderPath);

// Create the build directory
fs.ensureDirSync(buildFolderPath);

// Take each contract inside the output and write each contract to a different file
for (let contract in output) {
  if (output.hasOwnProperty(contract)) {
    fs.outputJsonSync(
      path.resolve(buildFolderPath, contract.replace(":", "") + ".json"),
      output[contract]
    );
  }
}
