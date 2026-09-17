// SPDX-License-Identifier: GPL-3.0-only
import { Builder, By, type WebDriver, until } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";
import chrome from "selenium-webdriver/chrome.js";

let driver: WebDriver | null = null;
function requireDriver(): WebDriver { if (!driver) throw new Error("Selenium browser is not started. Call browser_start first."); return driver; }
function locator(using: string, value: string): By { if (using === "css") return By.css(value); if (using === "xpath") return By.xpath(value); if (using === "id") return By.id(value); if (using === "name") return By.name(value); if (using === "tag") return By.tagName(value); throw new Error(`Unsupported locator strategy: ${using}`); }
export async function start(browser: "firefox" | "chrome" = "firefox", profilePath?: string): Promise<{ browser: string; visible: boolean }> {
  if (driver) return { browser, visible: true };
  const builder = new Builder().forBrowser(browser);
  if (browser === "firefox") { const options = new firefox.Options(); if (profilePath) options.setProfile(profilePath); options.addArguments("-width=1280", "-height=900"); builder.setFirefoxOptions(options); }
  else { const options = new chrome.Options(); if (profilePath) options.addArguments(`--user-data-dir=${profilePath}`); options.addArguments("--window-size=1280,900"); builder.setChromeOptions(options); }
  driver = await builder.build();
  return { browser, visible: true };
}
export async function stop(): Promise<void> { if (driver) { const current = driver; driver = null; await current.quit(); } }
export async function navigate(url: string, waitMs = 10000): Promise<{ url: string; title: string }> { const d = requireDriver(); await d.get(url); await d.wait(until.urlIs(url), waitMs).catch(() => undefined); return { url: await d.getCurrentUrl(), title: await d.getTitle() }; }
export async function page(): Promise<{ url: string; title: string; text: string; html: string }> { const d = requireDriver(); return { url: await d.getCurrentUrl(), title: await d.getTitle(), text: await d.findElement(By.css("body")).getText(), html: await d.getPageSource() }; }
export async function find(using: string, value: string, all = false): Promise<Array<{ tag: string; text: string; attributes: Record<string, string | null> }>> { const d = requireDriver(); const elements = all ? await d.findElements(locator(using, value)) : [await d.findElement(locator(using, value))]; return Promise.all(elements.map(async element => ({ tag: await element.getTagName(), text: await element.getText(), attributes: { id: await element.getAttribute("id"), class: await element.getAttribute("class"), href: await element.getAttribute("href"), value: await element.getAttribute("value") } }))); }
export async function execute(script: string, args: unknown[] = []): Promise<unknown> { return requireDriver().executeScript(script, ...args); }
export async function tabs(): Promise<{ current: string; handles: string[] }> { const d = requireDriver(); return { current: await d.getWindowHandle(), handles: await d.getAllWindowHandles() }; }
export async function switchWindow(handle: string): Promise<void> { await requireDriver().switchTo().window(handle); }
export async function cookies(): Promise<unknown[]> { return requireDriver().manage().getCookies(); }
export async function screenshot(): Promise<string> { return requireDriver().takeScreenshot(); }
