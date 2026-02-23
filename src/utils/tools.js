class Tools {
  constructor() {}

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  unformatNumber(number) {
    if (!number) return "";
    return number.toString().replace(/\D/g, "");
  }
}

const tools = new Tools();
export default tools;
