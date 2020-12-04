import web3 from "./web3";
import CampaignFactory from "./build/CampaignFactory.json";

const address = "0x709193f034f175540561539F2354d86437bcB04D";

const instance = new web3.eth.Contract(
  JSON.parse(CampaignFactory.interface),
  address
);

export default instance;
