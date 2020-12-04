import Web3 from "web3";

let web3;

if (typeof window !== "undefined" && typeof window.web3 !== "undefined") {
  // Environment is browser & metamask is installed
  web3 = new Web3(window.web3.currentProvider);
} else {
  // Environment is server OR metamask is not installed
  const provider = new Web3.providers.HttpProvider(
    "https://rinkeby.infura.io/v3/2daa4a0bcdf04cb989864ae3bb36976d"
  );
  web3 = new Web3(provider);
}

export default web3;
