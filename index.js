const puppeteer = require("puppeteer");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const http = require("http");

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

const bot = new TelegramBot(TOKEN, { "polling": false });

let browser = puppeteer.launch({ "headless": false });
const check = async () => {
    if(browser instanceof Promise)
        browser = await browser;
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    await page.goto(URL);

    await page.waitForSelector("[elementtiming='bx.catalog.container']");

    const items = await page.$$("[data-marker='item']");
    for(let i of items) {
        try {
            const id = await page.evaluate(el => el.getAttribute("data-item-id"), i);
            console.log(id);
            if(listings.includes(id)) continue;
            listings.push(id);
            saveListings();
            const name = await page.evaluate(el => el.querySelector("h3[itemprop='name']").innerText, i);
            const url = await page.evaluate(el => el.querySelector("a[itemprop][data-marker]").getAttribute("href"), i);
            await bot.sendMessage(ID, name + "\n\n" + "https://avito.ru" + url);
        } catch(e) { console.error(e); }
    }
    await page.close();
};

setTimeout(check); // Check immediately
setInterval(check, 10 * 60 * 1000);

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("hi there");
}).listen(8080);