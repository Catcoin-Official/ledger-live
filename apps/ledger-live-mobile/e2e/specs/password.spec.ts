import { device, expect } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import SettingsPage from "../models/settings/settingsPage";
import GeneralSettingsPage from "../models/settings/generalSettingsPage";
import PasswordEntryPage from "../models/passwordEntryPage";
import { loadConfig } from "../bridge/server";
import { delay } from "../helpers";

const CORRECT_PASSWORD = "passWORD$123!";

let portfolioPage: PortfolioPage;
let settingsPage: SettingsPage;
let generalSettingsPage: GeneralSettingsPage;
let passwordEntryPage: PasswordEntryPage;

describe("Password Lock Screen", () => {
  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETH", true);
    portfolioPage = new PortfolioPage();
    settingsPage = new SettingsPage();
    generalSettingsPage = new GeneralSettingsPage();
    passwordEntryPage = new PasswordEntryPage();
  });

  it("should open on Portfolio page", async () => {
    await expect(portfolioPage.getSettingsButton()).toBeVisible();
  });

  it("should go to Settings", async () => {
    await portfolioPage.navigateToSettings();
  });

  it("should go navigate to General settings", async () => {
    await settingsPage.navigateToGeneralSettings();
  });

  it("should toggle Password lock", async () => {
    await generalSettingsPage.togglePassword();
  });

  it("should enter password twice", async () => {
    await generalSettingsPage.enterNewPassword(CORRECT_PASSWORD + "\n"); // use a linebreak instead of pressing the confirm button to handle the keyboard if it appears
    await generalSettingsPage.enterNewPassword(CORRECT_PASSWORD + "\n"); // confirm password step
  });

  it("should not require the password if the user exits the app for less than the lock timeout", async () => {
    await device.sendToHome(); // leave LLM app and go to phone's home screen
    await device.launchApp(); // launch app within the lock timeout (60 secs on prod, 5 secs with MOCK=1)
    await expect(generalSettingsPage.getPreferredCurrency()).toBeVisible();
  });

  it("should need to enter password to unlock app", async () => {
    await device.sendToHome();
    await delay(5500); // Wait for AUTOLOCK_TIMEOUT to activate, which is 5 secs on MOCK mode
    await device.launchApp(); // restart LLM
    await passwordEntryPage.enterPassword(CORRECT_PASSWORD);
    await passwordEntryPage.login();
  });

  it("should be back on General Settings page", async () => {
    await expect(generalSettingsPage.getPreferredCurrency()).toBeVisible();
  });
});
