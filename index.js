const jsdom = require("jsdom");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const { HttpsProxyAgent } = require("https-proxy-agent");

const { JSDOM } = jsdom;

const FILE = "listings.txt";

const { URL, TOKEN, ID } = process.env;
// A few basic URL checks
if(!URL.includes("&s=104")) {
    console.error("The URL must cointain sorting by date!");
    process.exit(1);
}

if(!fs.existsSync(FILE))
    fs.writeFileSync(FILE, "");

let listings = fs.readFileSync(FILE, "utf-8").split("\n").filter(x => x);
const saveListings = () => fs.writeFileSync(FILE, listings.join("\n"));

const bot = new TelegramBot(TOKEN, { "polling": true });

const check = async () => {
    const f = await fetch(URL, {
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
    });
    const t = await f.text();

    console.log(t);

    const dom = new JSDOM(t, { "contentType": "text/html" });
    const items = dom.window.document.querySelectorAll("[data-marker='item']");
    for(let i of items) {
        const id = i.getAttribute("data-item-id");
        if(listings.includes(id)) continue;
        listings.push(id);
        saveListings();
        const name = i.querySelector("meta[itemprop='description']").textContent;
        const url = i.querySelector("a[itemprop][data-marker]").getAttribute("href");
        bot.sendMessage(ID, name + "\n\n" + url);
    }
};

setTimeout(check); // Check immediately
setInterval(check, 2 * 60 * 1000);